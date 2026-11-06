const { getBot, isConnected, getVersion } = require('./minecraft/connection')
const { itemTotals, inventorySlots, emptySlotCount } = require('./minecraft/inventory')

function placeOf (bot) {
  if (!bot?.entity) return null

  const { x, y, z } = bot.entity.position.floored()
  return { x, y, z, dimension: bot.game?.dimension ?? null }
}

function snapshot () {
  const bot = getBot()

  return {
    connected: isConnected(),
    username: bot?.username ?? null,
    version: getVersion(),
    place: placeOf(bot),
    health: bot?.health ?? null,
    food: bot?.food ?? null,
    inventory: itemTotals(bot).map(([name, count]) => ({ name, count })),
    inventorySlots: inventorySlots(bot),
    emptySlots: emptySlotCount(bot)
  }
}

module.exports = { snapshot }
