const { InputError } = require('./errors')

const DEFAULT_RADIUS = 20
const DEFAULT_WHITELIST = ['MineProbe']
const MAX_RADIUS = 256
const MAX_WHITELIST = 100
const PLAYER_NAME = /^[A-Za-z0-9_]{1,16}$/

function uniqueNames (names) {
  const seen = new Set()

  return names.filter(name => {
    const key = name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function validStealthRadius (value) {
  const radius = Number(value)
  if (!Number.isFinite(radius) || radius < 1 || radius > MAX_RADIUS) {
    throw new InputError(`Stealth distance must be between 1 and ${MAX_RADIUS} blocks.`)
  }
  return radius
}

function validStealthWhitelist (value) {
  if (!Array.isArray(value) || value.length > MAX_WHITELIST) throw new InputError('The stealth whitelist is not valid.')

  const names = value.map(name => (typeof name === 'string' ? name.trim() : ''))
  const bad = names.find(name => !PLAYER_NAME.test(name))
  if (bad !== undefined) throw new InputError(`"${bad}" is not a Minecraft player name.`)

  return uniqueNames(names)
}

function defaultStealth () {
  return { stealthRadius: DEFAULT_RADIUS, stealthWhitelist: [...DEFAULT_WHITELIST] }
}

module.exports = { defaultStealth, validStealthRadius, validStealthWhitelist }
