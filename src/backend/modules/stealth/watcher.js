const config = require('../../config')
const { notify } = require('../../notifier')
const { getBot } = require('../../minecraft/connection')

const CHECK_INTERVAL_MS = 1500

let timer = null
let alerted = false
let onThreat = () => {}

function isWhitelisted (username, whitelist) {
  const name = String(username || '').toLowerCase()
  return whitelist.some(entry => entry.toLowerCase() === name)
}

function isThreat (bot, entity, { radius, whitelist }) {
  return entity.type === 'player' &&
    entity.username !== bot.username &&
    !isWhitelisted(entity.username, whitelist) &&
    entity.position.distanceTo(bot.entity.position) < radius
}

function checkForNearbyPlayers () {
  const bot = getBot()
  if (!bot?.entity || alerted) return

  const threats = Object.values(bot.entities).filter(entity => isThreat(bot, entity, config.stealth))
  if (threats.length === 0) return

  const names = threats.map(p => p.username).join(', ')
  alerted = true

  notify({
    event: 'player-nearby',
    title: 'Player nearby',
    description: `${names} came within ${config.stealth.radius} blocks. Leaving the server.`,
    level: 'alert'
  })

  onThreat(threats)
}

function startStealthWatcher (handleThreat) {
  if (timer) return

  onThreat = handleThreat

  console.log(`[STEALTH] Enabled, radius ${config.stealth.radius}`)
  console.log('[STEALTH] Whitelist:', config.stealth.whitelist.join(', ') || 'empty')

  timer = setInterval(() => {
    try {
      checkForNearbyPlayers()
    } catch (err) {
      console.log('[STEALTH ERROR]', err.message)
    }
  }, CHECK_INTERVAL_MS)
}

function stopStealthWatcher () {
  clearInterval(timer)
  timer = null
}

module.exports = { startStealthWatcher, stopStealthWatcher, isThreat }
