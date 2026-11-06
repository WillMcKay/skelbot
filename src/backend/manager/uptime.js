const path = require('path')
const { readJson, writeJson } = require('../utils/json-file')
const { botDataDir } = require('./store')

const DAY_MS = 24 * 60 * 60 * 1000
const HISTORY_DAYS = 365
const DATE = /^\d{4}-\d{2}-\d{2}$/

function loadStored (file) {
  const stored = readJson(file)
  if (stored === null) return null
  if (typeof stored.days !== 'object' || stored.days === null || Array.isArray(stored.days) || !Number.isFinite(stored.trackingSince)) {
    throw new Error(`Saved uptime in ${file} is not valid.`)
  }

  const days = Object.entries(stored.days).filter(([date, duration]) => DATE.test(date) && Number.isFinite(duration) && duration >= 0)
  return { days: Object.fromEntries(days), trackingSince: stored.trackingSince }
}

function addInterval (days, start, end) {
  let cursor = start
  while (cursor < end) {
    const date = new Date(cursor).toISOString().slice(0, 10)
    const intervalEnd = Math.min(end, Date.parse(`${date}T00:00:00Z`) + DAY_MS)
    days[date] = (days[date] ?? 0) + intervalEnd - cursor
    cursor = intervalEnd
  }
}

function pruneHistory (days, now) {
  const oldest = new Date(now - (HISTORY_DAYS - 1) * DAY_MS).toISOString().slice(0, 10)
  for (const date of Object.keys(days)) {
    if (date < oldest) delete days[date]
  }
}

class Uptime {
  constructor (id, onChange) {
    this.file = path.join(botDataDir(id), 'uptime.json')
    this.onChange = onChange
    this.connectedSince = null
    this.checkpointAt = null

    const stored = loadStored(this.file)
    this.days = stored?.days ?? {}
    this.trackingSince = stored?.trackingSince ?? Date.now()
    if (!stored) this.#save()
  }

  view ({ history = false } = {}) {
    const { trackingSince, connectedSince, checkpointAt } = this
    return { trackingSince, connectedSince, checkpointAt, ...(history ? { history: { ...this.days } } : {}) }
  }

  #save () {
    writeJson(this.file, { days: this.days, trackingSince: this.trackingSince })
  }

  #bank (at) {
    addInterval(this.days, this.checkpointAt, at)
    pruneHistory(this.days, at)

    try {
      this.#save()
    } catch (err) {
      console.error('[MANAGER] Could not save uptime:', err.message)
    }
  }

  #changed () {
    this.onChange(this.view({ history: true }))
  }

  track (connected, at = Date.now()) {
    if (connected === (this.connectedSince !== null)) return

    if (connected) {
      this.connectedSince = this.checkpointAt = at
    } else {
      this.#bank(at)
      this.connectedSince = this.checkpointAt = null
    }
    this.#changed()
  }

  checkpoint (at = Date.now()) {
    if (this.connectedSince === null) return

    this.#bank(at)
    this.checkpointAt = at
    this.#changed()
  }
}

module.exports = { Uptime }
