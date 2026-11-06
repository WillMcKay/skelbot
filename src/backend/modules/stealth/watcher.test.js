const test = require('node:test')
const assert = require('node:assert/strict')
const { isThreat } = require('./watcher')

const bot = { username: 'CHRRD', entity: { position: { x: 0 } } }
const settings = { radius: 20, whitelist: ['MineProbe'] }
const player = (username, distance) => ({ type: 'player', username, position: { distanceTo: () => distance } })

test('a stranger inside the radius is a threat', () => {
  assert.equal(isThreat(bot, player('Stranger', 19), settings), true)
})

test('a stranger outside the radius is not', () => {
  assert.equal(isThreat(bot, player('Stranger', 21), settings), false)
})

test('the whitelist ignores capitals', () => {
  assert.equal(isThreat(bot, player('mineprobe', 1), settings), false)
})

test('never reacts to itself or to mobs', () => {
  assert.equal(isThreat(bot, player('CHRRD', 1), settings), false)
  assert.equal(isThreat(bot, { ...player('Zombie', 1), type: 'mob' }, settings), false)
})
