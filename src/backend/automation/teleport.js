const { notify } = require('../notifier')
const { resolveComponent } = require('../evasion/lang')
const { isAutoBonesEnabled, stopAutomation } = require('./autoBones')
const { isBusy } = require('./cycle')

const TELEPORT_DISTANCE = 5

function describePlace ({ position, dimension }) {
  const { x, y, z } = position.floored()
  return `${x}, ${y}, ${z}${dimension ? ` (${dimension})` : ''}`
}

function farmingStatus () {
  return isAutoBonesEnabled() || isBusy()
    ? 'Farming stopped; restart the bot once it is back at the spawners.'
    : 'AutoBones was already off.'
}

async function handleTeleport (from, to) {
  notify({
    event: 'teleported',
    title: 'Bot teleported',
    description: `Moved from ${describePlace(from)} to ${describePlace(to)}. ${farmingStatus()}`,
    level: 'alert'
  })

  await stopAutomation()
}

async function handleDeath (place, cause) {
  notify({
    event: 'died',
    title: 'Bot died',
    description: `Died at ${describePlace(place)}${cause ? `: ${cause}` : ''}. It respawned on its own. ${farmingStatus()}`,
    level: 'alert'
  })

  await stopAutomation()
}

function watchTeleportsAndDeaths (bot, { onTeleport = handleTeleport, onDeath = handleDeath } = {}) {
  let last = null
  let changedWorld = false
  let respawning = false
  let deathMessage = null

  const snapshot = () => ({ position: bot.entity.position.clone(), dimension: bot.game.dimension })

  bot.on('physicsTick', () => {
    if (bot.entity) last = snapshot()
  })

  bot.on('respawn', () => {
    changedWorld = true
  })

  bot._client.on('death_combat_event', ({ playerId, message }) => {
    if (playerId === bot.entity?.id) deathMessage = resolveComponent(message)
  })

  bot.on('death', () => {
    const cause = deathMessage

    deathMessage = null
    respawning = true

    Promise.resolve(onDeath(snapshot(), cause)).catch(err => console.error('[DEATH]', err))
  })

  bot.on('forcedMove', () => {
    const from = last
    const to = snapshot()
    const worldChange = changedWorld
    const afterDeath = respawning

    last = to
    changedWorld = false
    respawning = false

    if (!from || afterDeath) return
    if (!worldChange && from.dimension === to.dimension && from.position.distanceTo(to.position) < TELEPORT_DISTANCE) return

    Promise.resolve(onTeleport(from, to)).catch(err => console.error('[TELEPORT]', err))
  })
}

module.exports = { watchTeleportsAndDeaths }
