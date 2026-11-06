const { resolveComponent } = require('../evasion/lang')

function countItem (bot, itemName) {
  if (!bot?.inventory) return 0

  return bot.inventory.items()
    .filter(item => item.name === itemName)
    .reduce((sum, item) => sum + item.count, 0)
}

function itemTotals (bot) {
  if (!bot?.inventory) return []

  const totals = {}

  for (const item of bot.inventory.items()) {
    totals[item.displayName] = (totals[item.displayName] || 0) + item.count
  }

  return Object.entries(totals).sort(([, a], [, b]) => b - a)
}

function inventorySlots (bot) {
  const inventory = bot?.inventory
  if (!inventory) return null

  const start = inventory.inventoryStart ?? 9

  return Array.from({ length: 36 }, (_, index) => {
    const item = inventory.slots[start + index]
    return item ? { name: item.displayName || item.name, itemName: item.name, count: item.count } : null
  })
}

function emptySlotCount (bot) {
  const inventory = bot?.inventory
  if (!inventory) return 0

  if (typeof inventory.emptySlotCount === 'function') {
    return inventory.emptySlotCount()
  }

  let empty = 0

  for (let slot = inventory.inventoryStart; slot < inventory.inventoryEnd; slot++) {
    if (!inventory.slots[slot]) empty++
  }

  return empty
}

function loreOf (item) {
  try {
    return (item.customLore ?? []).map(line => resolveComponent(line)).filter(Boolean)
  } catch {
    return []
  }
}

module.exports = { countItem, itemTotals, inventorySlots, emptySlotCount, loreOf }
