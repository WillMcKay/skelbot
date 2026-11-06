const path = require('path')
const { EventEmitter } = require('events')
const config = require('../config')
const { newId } = require('../utils/id')
const { readJson, writeJson } = require('../utils/json-file')
const { InputError } = require('./errors')
const { buildMessage, post } = require('./webhook-message')
const { validateWebhook } = require('./webhook-settings')

const FILE = path.join(config.dataDir, 'webhooks.json')

class Webhooks extends EventEmitter {
  constructor () {
    super()
    this.queues = new Map()
    this.results = new Map()
    this.hooks = readJson(FILE)?.webhooks ?? []
  }

  #save () {
    writeJson(FILE, { webhooks: this.hooks })
    this.emit('changed', this.list())
  }

  #find (id) {
    const hook = this.hooks.find(h => h.id === id)
    if (!hook) throw new InputError('No such webhook.')
    return hook
  }

  list () {
    return this.hooks.map(hook => ({ ...hook, lastResult: this.results.get(hook.id) ?? null }))
  }

  create (input) {
    const hook = { id: newId(), ...validateWebhook(input) }
    this.hooks.push(hook)
    this.#save()
    return hook
  }

  update (id, input) {
    const hook = this.#find(id)
    Object.assign(hook, validateWebhook({ ...hook, ...input }))
    this.#save()
    return hook
  }

  remove (id) {
    this.#find(id)
    this.hooks = this.hooks.filter(h => h.id !== id)
    this.results.delete(id)
    this.#save()
  }

  async test (input) {
    const hook = validateWebhook(input)
    await post(hook.url, buildMessage(hook, 'Example bot', {
      level: 'alert',
      title: 'Test message',
      description: 'This is how skelbot alerts will look in this channel.',
      fields: { Balance: '$12.4k', 'Profit today': '$3.1k' },
      at: Date.now()
    }))
  }

  #record (id, result) {
    this.results.set(id, { ...result, at: Date.now() })
    this.emit('changed', this.list())
  }

  deliver (bot, notification) {
    if (!notification.event) return

    for (const hook of this.hooks) {
      if (!hook.enabled || !hook.events.includes(notification.event)) continue
      if (hook.bots !== 'all' && !hook.bots.includes(bot.id)) continue

      const message = buildMessage(hook, bot.name, notification)
      const previous = this.queues.get(hook.id) ?? Promise.resolve()

      const next = previous
        .then(() => post(hook.url, message))
        .then(() => this.#record(hook.id, { ok: true }))
        .catch(err => {
          console.error(`[WEBHOOKS] ${hook.name}:`, err.message)
          this.#record(hook.id, { ok: false, error: err.message })
        })

      this.queues.set(hook.id, next)
      next.finally(() => {
        if (this.queues.get(hook.id) === next) this.queues.delete(hook.id)
      })
    }
  }
}

module.exports = { Webhooks }
