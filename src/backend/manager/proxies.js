const path = require('path')
const { EventEmitter } = require('events')
const config = require('../config')
const { parseProxyList } = require('../proxies/parse')
const { readJson, writeJson } = require('../utils/json-file')
const { InputError } = require('./errors')

const FILE = path.join(config.dataDir, 'proxies.json')
const MAX_LINES = 5000

class Proxies extends EventEmitter {
  constructor () {
    super()
    const stored = readJson(FILE)
    this.lines = Array.isArray(stored?.lines) ? stored.lines.map(String) : []
    this.required = stored?.required === true
  }

  #save () {
    writeJson(FILE, { lines: this.lines, required: this.required })
    this.emit('changed', this.view())
  }

  view () {
    return {
      required: this.required,
      entries: parseProxyList(this.lines).map(({ line, proxy, error }) => (
        proxy
          ? { line, type: proxy.type, host: proxy.host, port: proxy.port, auth: Boolean(proxy.username) }
          : { line, error }
      ))
    }
  }

  update (input) {
    if (input.lines !== undefined) {
      if (!Array.isArray(input.lines) || input.lines.some(line => typeof line !== 'string')) throw new InputError('Proxies must be a list of lines.')
      if (input.lines.length > MAX_LINES) throw new InputError(`At most ${MAX_LINES} proxies.`)
      this.lines = input.lines.map(line => line.trim()).filter(Boolean)
    }
    if (input.required !== undefined) this.required = input.required === true

    this.#save()
    return this.view()
  }

  forBot () {
    return {
      proxies: parseProxyList(this.lines).filter(entry => entry.proxy).map(entry => entry.proxy),
      required: this.required
    }
  }
}

module.exports = { Proxies }
