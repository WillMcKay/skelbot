const path = require('path')
const config = require('../config')
const { readJson, writeJson } = require('../utils/json-file')

const FILE = path.join(config.dataDir, 'stats.json')

const HOUR_MS = 60 * 60 * 1000

function freshStats (now = Date.now()) {
  return { allTime: 0, daily: 0, hourly: 0, history: [], sales: {}, items: {}, runMs: 0, dayStartedAt: now, hourStartedAt: now }
}

function load () {
  try {
    return { ...freshStats(), ...readJson(FILE) }
  } catch (err) {
    console.error('[STATS]', err.message, '- starting fresh.')
    return freshStats()
  }
}

const stats = load()
const sessionStartedAt = Date.now()
let session = 0
let runCountedTo = sessionStartedAt

function save () {
  const now = Date.now()
  stats.runMs += now - runCountedTo
  runCountedTo = now

  try {
    writeJson(FILE, stats)
  } catch (err) {
    console.error('[STATS] Could not save:', err.message)
  }
}

function addProfit (amount) {
  session += amount
  stats.hourly += amount
  stats.daily += amount
  stats.allTime += amount
  save()
}

function recordSale (itemName, count, revenue = 0) {
  stats.sales[itemName] = salesOf(itemName) + count

  const item = stats.items[itemName] ?? { sold: 0, revenue: 0 }
  stats.items[itemName] = { sold: item.sold + count, revenue: item.revenue + revenue }

  save()
}

function salesOf (itemName) {
  return stats.sales[itemName] || 0
}

function getProfits () {
  return { session, hourly: stats.hourly, daily: stats.daily, allTime: stats.allTime }
}

function rateHours (ms) {
  return Math.max(ms, HOUR_MS) / HOUR_MS
}

function runMsSoFar () {
  return stats.runMs + (Date.now() - runCountedTo)
}

function getRates () {
  const runMs = runMsSoFar()

  return {
    sessionPerHour: session / rateHours(Date.now() - sessionStartedAt),
    allTimePerHour: stats.allTime / rateHours(runMs),
    runHours: runMs / HOUR_MS
  }
}

function itemStats (itemName) {
  const { sold, revenue } = stats.items[itemName] ?? { sold: 0, revenue: 0 }
  return { sold, averagePrice: sold ? revenue / sold : 0, perHour: sold / rateHours(runMsSoFar()) }
}

function getPeriods () {
  return { hourStartedAt: stats.hourStartedAt, dayStartedAt: stats.dayStartedAt }
}

function getHourlyHistory () {
  return [...stats.history, { startedAt: stats.hourStartedAt, profit: stats.hourly, current: true }]
}

function resetHourly () {
  stats.history = [...stats.history, { startedAt: stats.hourStartedAt, profit: stats.hourly }]
  stats.hourly = 0
  stats.hourStartedAt = Date.now()
  save()
}

function resetDaily () {
  stats.daily = 0
  stats.sales = {}
  stats.dayStartedAt = Date.now()
  save()
}

module.exports = {
  addProfit,
  recordSale,
  salesOf,
  getProfits,
  getRates,
  itemStats,
  getHourlyHistory,
  getPeriods,
  recordRunTime: save,
  resetHourly,
  resetDaily
}
