const { join, whenReady } = require('../evasion/join')
const { resolveComponent } = require('../evasion/lang')
const config = require('../config')
const { notify } = require('../notifier')
const { strip } = require('../utils/text')
const { closeAllWindows } = require('./windows')
const { enableDebugLogging } = require('./debug')
const { loginMicrosoft, loginRetryDelay } = require('./auth')
const { routeToServer } = require('../proxies/connect')

const RECONNECT_DELAY_MS = 15000
const STALE_SESSION = /already online/i
const MAX_STALE_SESSION_RETRIES = 6

let bot = null
let reconnecting = false
let connected = false
let quitting = false
let announcedDown = false
let kickReason = null
let loginFailures = 0
let rejoinReason = null
let hasJoined = false
let staleSessionRetries = 0

function getBot () {
  return connected ? bot : null
}

function isConnected () {
  return connected
}

function getVersion () {
  return bot?.version || config.mc.version || 'default'
}

function staleSessionDelay (reason, { joined, retries }) {
  if (!joined || !STALE_SESSION.test(reason) || retries >= MAX_STALE_SESSION_RETRIES) return null

  return loginRetryDelay(retries + 1)
}

function scheduleReconnect (handlers, reason, delayMs = RECONNECT_DELAY_MS) {
  connected = false

  if (reconnecting || quitting) return

  reconnecting = true

  console.log(`[MC] ${reason} Reconnecting in ${delayMs / 1000}s.`)

  if (!announcedDown) {
    announcedDown = true
    notify({
      event: 'disconnected',
      title: 'Disconnected',
      description: `${reason} Retrying until it is back.`,
      level: 'warning'
    })
  }

  setTimeout(() => startMinecraftBot(handlers), delayMs)
}

async function startMinecraftBot (handlers) {
  reconnecting = false

  console.log(`[MC] Connecting with version: ${getVersion()}`)

  let account

  try {
    account = await loginMicrosoft(config.mc.username)
  } catch (err) {
    console.error('[MC AUTH]', err.message)
    loginFailures++
    scheduleReconnect(handlers, `Microsoft login failed: ${err.message}.`, loginRetryDelay(loginFailures))
    return
  }

  loginFailures = 0

  const route = await routeToServer({ ...config.network, host: config.mc.host, port: config.mc.port })
  if (route.blocked) {
    scheduleReconnect(handlers, `${route.blocked} Not connecting without one.`)
    return
  }

  bot = join({
    host: config.mc.host,
    port: config.mc.port,
    version: config.mc.version,
    ...account,
    ...(route.socket ? { connect: client => { client.setSocket(route.socket); client.emit('connect') } } : {})
  })

  if (config.debug.logChat) enableDebugLogging(bot)

  bot.once('spawn', async () => {
    connected = true
    announcedDown = false
    kickReason = null
    hasJoined = true
    staleSessionRetries = 0
    console.log('[MC] Bot spawned')

    await whenReady(bot)
    if (connected) Promise.resolve(handlers.onSpawn(bot)).catch(err => console.error('[SPAWN HANDLER]', err))
  })

  bot.on('message', async (jsonMsg, position) => {
    const msg = strip(jsonMsg.toString())

    if (config.debug.logChat) console.log(`[CHAT ${position}]`, msg)

    try {
      await handlers.onChat(msg)
    } catch (err) {
      console.error('[CHAT HANDLER]', err)
    }
  })

  bot.on('kicked', reason => {
    kickReason = resolveComponent(reason) || 'no reason given'
    console.log('[MC KICKED]', kickReason)
  })

  bot.on('error', err => console.error('[MC ERROR]', err.message))

  bot.on('end', () => {
    connected = false

    if (!kickReason) {
      const reason = rejoinReason ?? 'Lost connection to the server.'
      rejoinReason = null
      return scheduleReconnect(handlers, reason)
    }

    const delay = staleSessionDelay(kickReason, { joined: hasJoined, retries: staleSessionRetries })

    if (delay !== null) {
      staleSessionRetries++
      kickReason = null
      return scheduleReconnect(handlers, 'The server still has the old session open.', delay)
    }

    quitting = true
    Promise.resolve(handlers.onKicked(kickReason)).catch(err => console.error('[KICK HANDLER]', err))
  })
}

async function rejoinMinecraftBot (reason) {
  if (!connected || quitting) return false

  try {
    await closeAllWindows(bot)
  } catch {}

  rejoinReason = reason
  bot.quit('Rejoining')

  return true
}

async function quitMinecraftBot () {
  quitting = true

  if (!bot) return

  try {
    await closeAllWindows(bot)
  } catch {}

  try {
    bot.quit('Shutdown')
  } catch {}
}

module.exports = { getBot, isConnected, getVersion, startMinecraftBot, rejoinMinecraftBot, quitMinecraftBot, staleSessionDelay }
