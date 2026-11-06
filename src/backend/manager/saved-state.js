const path = require('path')
const config = require('../config')
const { readJson } = require('../utils/json-file')
const { botDataDir } = require('./store')

const HOUR_MS = 60 * 60 * 1000

const numberOrZero = value => Number.isFinite(value) ? value : 0

function readStats (id) {
  try {
    const stats = readJson(path.join(botDataDir(id), 'stats.json'))
    if (stats === null || (typeof stats === 'object' && !Array.isArray(stats))) return stats
    console.error(`[MANAGER] Saved stats for bot ${id} are not a JSON object.`)
  } catch (err) {
    console.error('[MANAGER]', err.message)
  }
  return null
}

function orderState ({ item, label }, stats, rateHours) {
  const itemStats = stats.items?.[item] ?? {}
  const sold = numberOrZero(itemStats.sold)

  return {
    item,
    label,
    inInventory: null,
    soldToday: numberOrZero(stats.sales?.[item]),
    sold,
    averagePrice: sold ? numberOrZero(itemStats.revenue) / sold : 0,
    perHour: sold / rateHours
  }
}

function loadSavedState (id) {
  const stats = readStats(id)
  if (!stats) return null

  const runMs = numberOrZero(stats.runMs)
  const rateHours = Math.max(runMs, HOUR_MS) / HOUR_MS
  const hourly = numberOrZero(stats.hourly)
  const allTime = numberOrZero(stats.allTime)

  return {
    connected: false,
    username: null,
    version: null,
    place: null,
    health: null,
    food: null,
    modules: {
      spawners: {
        autoBones: false,
        cycleRunning: false,
        balance: null,
        lastIncome: null,
        profits: { session: 0, hourly, daily: numberOrZero(stats.daily), allTime },
        rates: { sessionPerHour: 0, allTimePerHour: allTime / rateHours, runHours: runMs / HOUR_MS },
        history: [
          ...(Array.isArray(stats.history) ? stats.history : []),
          { startedAt: numberOrZero(stats.hourStartedAt), profit: hourly, current: true }
        ],
        orders: Object.values(config.orders).map(order => orderState(order, stats, rateHours))
      }
    },
    inventory: [],
    inventorySlots: null,
    emptySlots: null
  }
}

module.exports = { loadSavedState }
