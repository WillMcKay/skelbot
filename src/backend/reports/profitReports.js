const config = require('../config')
const { notify } = require('../notifier')
const { money, duration } = require('../utils/text')
const { getBalance, updateBalance } = require('../economy/balance')
const { getProfits, getRates, getPeriods, recordRunTime, salesOf, resetHourly, resetDaily } = require('../economy/profits')

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const CHECK_MS = 60 * 1000

let timer = null

function salesFields () {
  return Object.fromEntries(Object.values(config.orders)
    .map(({ item, label }) => [`${label}s sold`, salesOf(item)]))
}

function summary () {
  const profits = getProfits()
  const { allTimePerHour: perHour, runHours } = getRates()

  return `Today ${money(profits.daily)} · ${money(perHour)} per hour · All time ${money(profits.allTime)} · Balance ${money(getBalance())} · Running ${duration(runHours * HOUR_MS)}`
}

function summaryFields () {
  const profits = getProfits()

  return {
    Balance: money(getBalance()),
    'Profit today': money(profits.daily),
    'Profit all time': money(profits.allTime),
    'Per hour (all time)': money(getRates().allTimePerHour),
    ...salesFields()
  }
}

async function sendDailyReport () {
  await updateBalance()

  notify({ event: 'daily-report', title: 'Daily report', description: summary() })

  resetDaily()
}

function checkPeriods () {
  recordRunTime()

  const { hourStartedAt, dayStartedAt } = getPeriods()

  if (Date.now() - hourStartedAt >= HOUR_MS) resetHourly()
  if (Date.now() - dayStartedAt >= DAY_MS) sendDailyReport().catch(err => console.error('[REPORT]', err))
}

function startProfitReports () {
  stopProfitReports()
  checkPeriods()
  timer = setInterval(checkPeriods, CHECK_MS)
}

function stopProfitReports () {
  clearInterval(timer)
  timer = null
}

module.exports = { summaryFields, startProfitReports, stopProfitReports }
