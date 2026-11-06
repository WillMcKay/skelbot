const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { Vec3 } = require('vec3')
const { watchTeleportsAndDeaths } = require('./teleport')

function watchedBot () {
  const bot = new EventEmitter()
  bot._client = new EventEmitter()
  bot.entity = { id: 7, position: new Vec3(10, 64, 10) }
  bot.game = { dimension: 'overworld' }

  const calls = { teleports: [], deaths: [] }

  watchTeleportsAndDeaths(bot, {
    onTeleport: async (from, to) => calls.teleports.push({ from, to }),
    onDeath: async (place, cause) => calls.deaths.push({ place, cause })
  })

  bot.emit('physicsTick')

  return { bot, calls }
}

function respawnAt (bot, x, y, z) {
  bot.emit('respawn')
  bot.entity.position = new Vec3(x, y, z)
  bot.emit('forcedMove')
}

test('a death reports where it happened and what killed the bot', () => {
  const { bot, calls } = watchedBot()

  bot._client.emit('death_combat_event', { playerId: 7, message: { type: 'string', value: 'CHRRD fell out of the world' } })
  bot.emit('death')

  assert.equal(calls.deaths.length, 1)
  assert.equal(calls.deaths[0].cause, 'CHRRD fell out of the world')
  assert.deepEqual(calls.deaths[0].place.position, new Vec3(10, 64, 10))
})

test('another player dying is not the bot dying', () => {
  const { bot, calls } = watchedBot()

  bot._client.emit('death_combat_event', { playerId: 99, message: { type: 'string', value: 'Someone else died' } })
  bot.emit('death')

  assert.equal(calls.deaths[0].cause, null)
})

test('the respawn after a death is not reported as a teleport', () => {
  const { bot, calls } = watchedBot()

  bot.emit('death')
  respawnAt(bot, 5000, 70, 5000)

  assert.equal(calls.teleports.length, 0)
})

test('a teleport after the respawn is still reported', () => {
  const { bot, calls } = watchedBot()

  bot.emit('death')
  respawnAt(bot, 5000, 70, 5000)
  bot.emit('physicsTick')
  bot.entity.position = new Vec3(9000, 70, 9000)
  bot.emit('forcedMove')

  assert.equal(calls.teleports.length, 1)
})

test('a world change without a death is still a teleport', () => {
  const { bot, calls } = watchedBot()

  respawnAt(bot, 5000, 70, 5000)

  assert.equal(calls.deaths.length, 0)
  assert.equal(calls.teleports.length, 1)
})
