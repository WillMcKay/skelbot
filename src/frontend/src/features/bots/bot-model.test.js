import assert from 'node:assert/strict'
import { test } from 'node:test'
import { earnedLast24h, fleetHistory, ratePerHour, totals } from './bot-model.js'

const HOUR_MS = 60 * 60 * 1000
const NOW = 1_800_000_000_000
const hoursAgo = hours => NOW - hours * HOUR_MS

const stateWith = (...history) => ({ history, profits: { allTime: 500 }, rates: { runHours: 10 } })
const botWith = (state, connected = true) => ({ status: 'running', modules: ['spawners'], state: { connected, modules: { spawners: state } } })

test('profit older than 24 hours no longer counts', () => {
  const state = stateWith({ startedAt: hoursAgo(30), profit: 1000 }, { startedAt: hoursAgo(5), profit: 200 })

  assert.equal(earnedLast24h(state, NOW), 200)
})

test('a missing history earns nothing', () => {
  assert.equal(earnedLast24h(undefined, NOW), 0)
  assert.equal(ratePerHour({}, NOW), 0)
})

test('rate ignores hours the bot was not running', () => {
  const state = stateWith({ startedAt: hoursAgo(20), profit: 300 }, { startedAt: hoursAgo(19), profit: 100 })

  assert.equal(ratePerHour(state, NOW), 200)
})

test('rate counts a part-finished hour as the time so far', () => {
  const state = stateWith({ startedAt: hoursAgo(2), profit: 100 }, { startedAt: hoursAgo(1.5), profit: 50 }, { startedAt: hoursAgo(0.5), profit: 25 })

  assert.equal(ratePerHour(state, NOW), 175 / 2.5)
})

test('a brand new bot does not project minutes of profit across an hour', () => {
  assert.equal(ratePerHour(stateWith({ startedAt: hoursAgo(0.1), profit: 100 }), NOW), 100)
})

test('the fleet series has 24 hours and adds up to the 24 hour total', () => {
  const bots = [
    botWith(stateWith({ startedAt: hoursAgo(24), profit: 10 }, { startedAt: hoursAgo(3.5), profit: 20 })),
    botWith(stateWith({ startedAt: hoursAgo(3.2), profit: 30 }, { startedAt: hoursAgo(0), profit: 40 }), false)
  ]
  const series = fleetHistory(bots, NOW)

  assert.equal(series.length, 24)
  assert.equal(series.reduce((total, hour) => total + hour.profit, 0), 100)
  assert.equal(series[0].profit, 10)
  assert.equal(series[20].profit, 50)
  assert.equal(series[23].profit, 40)
  assert.equal(series[23].current, true)
})

test('totals still report a rate when every bot is offline', () => {
  const t = totals([botWith(stateWith({ startedAt: Date.now() - HOUR_MS * 2, profit: 400 }), false)])

  assert.equal(t.online, 0)
  assert.equal(t.last24h, 400)
  assert.equal(t.perHour, 400)
  assert.equal(t.allTime, 500)
  assert.equal(t.runHours, 10)
})
