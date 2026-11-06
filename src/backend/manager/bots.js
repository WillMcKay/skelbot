const path = require('path')
const readline = require('readline')
const { fork } = require('child_process')
const { EventEmitter } = require('events')
const { newId } = require('../utils/id')
const { pushLimited } = require('../utils/list')
const { BotLog } = require('./bot-log')
const { BANNER } = require('./console-filter')
const { InputError } = require('./errors')
const { loadSavedState } = require('./saved-state')
const { loadBots, saveBots, botDataDir } = require('./store')
const { Uptime } = require('./uptime')
const { cleanText } = require('./validate')
const { hasCommand, normalizeModuleIds, selectModuleIds, withOneActive } = require('../modules')
const { defaultServer, validServerHost, validServerPort, validServerVersion } = require('./server-settings')
const { defaultSpawner, validCycleMinutes } = require('./spawner-settings')
const { defaultStealth, validStealthRadius, validStealthWhitelist } = require('./stealth-settings')

const WORKER = path.join(__dirname, '..', 'worker.js')
const MAX_NOTIFICATIONS = 100
const STOP_TIMEOUT_MS = 45000
const RESTART_DELAY_MS = 15000
const MAX_RESTART_DELAY_MS = 5 * 60 * 1000
const STABLE_AFTER_MS = 60000
const UPTIME_CHECKPOINT_MS = 30000
const MINUTE_MS = 60 * 1000

const PLAYER_NAME = /^[A-Za-z0-9_]{1,16}$/
const NO_PROXIES = { forBot: () => ({ proxies: [], required: false }) }

function validPayoutTo (value) {
  const payoutTo = cleanText(value, 'Pay out to', { max: 16 })
  if (payoutTo && !PLAYER_NAME.test(payoutTo)) throw new InputError('Pay out to must be a Minecraft player name.')
  return payoutTo
}

function validAmount (value, label) {
  if (value === undefined || value === null || value === '') return 0
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) throw new InputError(`${label} must be zero or more.`)
  return amount
}

function requirePayoutPlayer (modules, payoutTo) {
  if (modules.includes('payout') && !payoutTo) throw new InputError('Choose a player for Auto payout.')
}

function proxyBlock ({ required, proxies }) {
  return required && proxies.length === 0
    ? '"Require a proxy" is on, but the proxy list has no valid proxies.'
    : null
}

class BotManager extends EventEmitter {
  constructor ({ proxies = NO_PROXIES } = {}) {
    super()
    this.proxies = proxies
    this.bots = new Map()

    for (const record of loadBots()) this.bots.set(record.id, this.#fresh(record))

    const checkpoint = () => { for (const bot of this.bots.values()) bot.uptime.checkpoint() }
    setInterval(checkpoint, UPTIME_CHECKPOINT_MS).unref()
  }

  #fresh (record) {
    record.modules = withOneActive(normalizeModuleIds(record.modules))
    Object.assign(record, { payoutMin: 0, payoutKeep: 0, ...defaultServer(), ...defaultSpawner(), ...defaultStealth(), ...record })
    return {
      record,
      child: null,
      status: 'stopped',
      state: loadSavedState(record.id),
      auth: null,
      log: new BotLog(record.id),
      notifications: [],
      restartDelay: RESTART_DELAY_MS,
      restartTimer: null,
      startedAt: 0,
      stale: false,
      uptime: new Uptime(record.id, uptime => this.emit('uptime', { id: record.id, uptime }))
    }
  }

  #save () {
    saveBots([...this.bots.values()].map(bot => bot.record))
  }

  #get (id) {
    const bot = this.bots.get(id)
    if (!bot) throw new InputError('No such bot.')
    return bot
  }

  view (id, { full = false } = {}) {
    const bot = this.#get(id)
    const { account, uuid, ...record } = bot.record

    return {
      ...record,
      status: bot.status,
      stale: bot.stale,
      state: bot.state,
      auth: bot.auth,
      uptime: bot.uptime.view({ history: full }),
      ...(full ? { logs: bot.log.entries, notifications: bot.notifications } : {})
    }
  }

  list ({ full = false } = {}) {
    return [...this.bots.keys()].map(id => this.view(id, { full }))
  }

  #changed (id) {
    this.emit('bot', this.view(id))
  }

  #log (bot, line, stream) {
    const entry = bot.log.add(line, stream)
    if (entry) this.emit('log', { id: bot.record.id, ...entry })
  }

  #onMessage (bot, message) {
    const { id } = bot.record

    if (message.type === 'state') {
      bot.uptime.track(Boolean(message.state.connected))
      bot.state = message.state

      const username = message.state.username
      if (username && username !== bot.record.name) {
        bot.record.name = username
        this.#save()
      }

      this.#changed(id)
    }

    if (message.type === 'auth') {
      bot.auth = message.code ? { code: message.code, url: message.url } : null
      this.#changed(id)
    }

    if (message.type === 'notify') this.#notify(bot, message.notification)
  }

  #notify (bot, notification) {
    pushLimited(bot.notifications, notification, MAX_NOTIFICATIONS)
    this.emit('notification', { id: bot.record.id, name: bot.record.name, notification })
  }

  #onExit (bot, code, signal) {
    const { id } = bot.record
    const wasStopping = bot.status === 'stopping'

    bot.uptime.track(false)
    bot.child = null
    bot.auth = null
    bot.state = bot.state && { ...bot.state, connected: false, cycleRunning: false }
    bot.stale = false

    this.#log(bot, `Process exited (${signal ?? `code ${code}`}).`, 'manager')

    if (wasStopping || code === 0 || !bot.record.running) {
      if (!wasStopping && bot.record.running) {
        bot.record.running = false
        this.#save()
      }

      bot.status = 'stopped'
      bot.log.close()
      this.#changed(id)
      return
    }

    if (Date.now() - bot.startedAt > STABLE_AFTER_MS) bot.restartDelay = RESTART_DELAY_MS

    bot.status = 'restarting'
    const wait = `${Math.round(bot.restartDelay / 1000)}s`
    this.#log(bot, `Crashed; restarting in ${wait}.`, 'manager')
    this.#notify(bot, { event: 'crashed', level: 'error', title: 'Bot crashed', description: `The bot process exited (${signal ?? `code ${code}`}). Restarting in ${wait}; the console shows why.`, at: Date.now() })

    bot.restartTimer = setTimeout(() => {
      bot.restartTimer = null
      if (bot.record.running && !bot.child) this.#spawn(bot)
    }, bot.restartDelay)
    bot.restartDelay = Math.min(bot.restartDelay * 2, MAX_RESTART_DELAY_MS)

    this.#changed(id)
  }

  #spawn (bot) {
    const { id, account, payoutTo, payoutMin, payoutKeep, stealthRadius, stealthWhitelist, cycleMinutes, serverHost, serverPort, serverVersion } = bot.record
    const network = this.proxies.forBot()

    const blocked = proxyBlock(network)
    if (blocked) {
      this.#log(bot, `Not starting: ${blocked}`, 'manager')
      bot.status = 'stopped'
      this.#changed(id)
      return
    }

    const child = fork(WORKER, [], {
      env: {
        ...process.env,
        SKELBOT_BOT_ID: id,
        SKELBOT_DATA_DIR: botDataDir(id),
        SKELBOT_MODULES: JSON.stringify(bot.record.modules),
        MC_USERNAME: account,
        MC_HOST: serverHost,
        MC_PORT: String(serverPort),
        MC_VERSION: serverVersion,
        CYCLE_MS: String(cycleMinutes * MINUTE_MS),
        PAYOUT_TO: payoutTo,
        PAYOUT_MIN_BALANCE: String(payoutMin),
        PAYOUT_KEEP: String(payoutKeep),
        SKELBOT_STEALTH: JSON.stringify({ radius: stealthRadius, whitelist: stealthWhitelist }),
        SKELBOT_PROXIES: JSON.stringify(network.proxies),
        SKELBOT_REQUIRE_PROXY: String(network.required)
      },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      detached: true
    })

    bot.child = child
    bot.status = 'running'
    bot.startedAt = Date.now()
    bot.log.open()

    for (const [stream, source] of [['out', child.stdout], ['err', child.stderr]]) {
      readline.createInterface({ input: source }).on('line', line => this.#log(bot, line, stream))
    }

    child.on('message', message => this.#onMessage(bot, message))
    child.on('exit', (code, signal) => this.#onExit(bot, code, signal))
    child.on('error', err => this.#log(bot, `Process error: ${err.message}`, 'manager'))

    for (const row of BANNER) this.#log(bot, row, 'banner')
    this.#log(bot, `Starting ${bot.record.name}…`, 'manager')
    this.#changed(id)
  }

  start (id) {
    const bot = this.#get(id)
    if (bot.child) return

    const blocked = proxyBlock(this.proxies.forBot())
    if (blocked) throw new InputError(`${blocked} Add proxies or turn it off on the Proxies page.`)

    clearTimeout(bot.restartTimer)
    bot.restartTimer = null
    bot.restartDelay = RESTART_DELAY_MS

    if (!bot.record.running) {
      bot.record.running = true
      this.#save()
    }

    bot.log.clear()
    this.emit('logs-cleared', id)
    this.#spawn(bot)
  }

  stop (id, { remember = true } = {}) {
    const bot = this.#get(id)

    clearTimeout(bot.restartTimer)
    bot.restartTimer = null

    if (remember && bot.record.running) {
      bot.record.running = false
      this.#save()
    }

    if (!bot.child) {
      bot.status = 'stopped'
      this.#changed(id)
      return Promise.resolve()
    }

    const child = bot.child

    if (bot.status !== 'stopping') {
      bot.status = 'stopping'
      this.#changed(id)
      child.send({ type: 'shutdown' })
    }

    return new Promise(resolve => {
      const kill = setTimeout(() => {
        this.#log(bot, 'Did not stop in time; killing it.', 'manager')
        child.kill('SIGKILL')
      }, STOP_TIMEOUT_MS)

      child.once('exit', () => {
        clearTimeout(kill)
        resolve()
      })
    })
  }

  async restart (id) {
    const bot = this.#get(id)
    if (!bot.child) return this.start(id)

    bot.record.running = true
    await this.stop(id, { remember: false })
    this.start(id)
  }

  command (id, name) {
    const bot = this.#get(id)
    if (!hasCommand(name, bot.record.modules)) throw new InputError('Unknown command.')
    if (!bot.child?.connected) throw new InputError('The bot is not running.')

    bot.child.send({ type: 'command', name })
  }

  botUsing (login, ignoreId = null) {
    for (const other of this.bots.values()) {
      if (other.record.id === ignoreId) continue
      const sameId = login.uuid && other.record.uuid === login.uuid
      const sameName = login.username && other.record.name?.toLowerCase() === login.username.toLowerCase()
      if (sameId || sameName) return other.record.name
    }
    return null
  }

  #assertFree (login, ignoreId) {
    const taken = this.botUsing(login, ignoreId)
    if (taken) throw new InputError(`${taken} is already a bot; two bots on one account would kick each other.`)
  }

  create (input) {
    const { login } = input
    if (!login) throw new InputError('Sign in with Microsoft first.')
    this.#assertFree(login)

    const record = {
      id: newId(),
      name: login.username,
      account: login.key,
      uuid: login.uuid,
      payoutTo: validPayoutTo(input.payoutTo),
      payoutMin: validAmount(input.payoutMin, 'Pay when balance reaches'),
      payoutKeep: validAmount(input.payoutKeep, 'Keep on bot'),
      ...defaultServer(),
      ...(input.serverHost === undefined ? {} : { serverHost: validServerHost(input.serverHost) }),
      ...(input.serverPort === undefined ? {} : { serverPort: validServerPort(input.serverPort) }),
      ...(input.serverVersion === undefined ? {} : { serverVersion: validServerVersion(input.serverVersion) }),
      ...defaultSpawner(),
      ...(input.cycleMinutes === undefined ? {} : { cycleMinutes: validCycleMinutes(input.cycleMinutes) }),
      ...defaultStealth(),
      ...(input.stealthRadius === undefined ? {} : { stealthRadius: validStealthRadius(input.stealthRadius) }),
      ...(input.stealthWhitelist === undefined ? {} : { stealthWhitelist: validStealthWhitelist(input.stealthWhitelist) }),
      modules: selectModuleIds(input.modules),
      running: false
    }

    requirePayoutPlayer(record.modules, record.payoutTo)
    this.bots.set(record.id, this.#fresh(record))
    this.#save()
    this.#changed(record.id)

    if (input.start) this.start(record.id)
    return this.view(record.id)
  }

  update (id, input) {
    const bot = this.#get(id)
    const next = {
      payoutTo: validPayoutTo(input.payoutTo ?? bot.record.payoutTo),
      payoutMin: validAmount(input.payoutMin ?? bot.record.payoutMin, 'Pay when balance reaches'),
      payoutKeep: validAmount(input.payoutKeep ?? bot.record.payoutKeep, 'Keep on bot'),
      serverHost: validServerHost(input.serverHost ?? bot.record.serverHost),
      serverPort: validServerPort(input.serverPort ?? bot.record.serverPort),
      serverVersion: validServerVersion(input.serverVersion ?? bot.record.serverVersion),
      cycleMinutes: validCycleMinutes(input.cycleMinutes ?? bot.record.cycleMinutes),
      stealthRadius: validStealthRadius(input.stealthRadius ?? bot.record.stealthRadius),
      stealthWhitelist: validStealthWhitelist(input.stealthWhitelist ?? bot.record.stealthWhitelist),
      ...(input.modules === undefined ? {} : { modules: selectModuleIds(input.modules) })
    }

    requirePayoutPlayer(next.modules ?? bot.record.modules, next.payoutTo)

    if (input.login) {
      this.#assertFree(input.login, id)
      Object.assign(next, { account: input.login.key, name: input.login.username, uuid: input.login.uuid })
    }

    const settingsChanged = Object.entries(next).some(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length !== bot.record[key]?.length || value.some((id, index) => id !== bot.record[key][index])
      }
      return value !== bot.record[key]
    })
    bot.record = { ...bot.record, ...next }
    if (bot.child && settingsChanged) bot.stale = true

    this.#save()
    this.#changed(id)
    return this.view(id)
  }

  remove (id) {
    const bot = this.#get(id)
    if (bot.child || bot.status === 'restarting') throw new InputError('Stop the bot before removing it.')

    this.bots.delete(id)
    this.#save()
    this.emit('removed', id)
  }

  startAll () {
    for (const bot of this.bots.values()) {
      if (bot.record.running) this.#spawn(bot)
    }
  }

  stopAll () {
    return Promise.all([...this.bots.keys()].map(id => this.stop(id, { remember: false })))
  }
}

module.exports = { BotManager }
