const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { freeSlotsIn, watchRightClicks } = require('./spawner')

function fakeBot ({ held, crouching = false } = {}) {
  const bot = new EventEmitter()
  bot._client = new EventEmitter()
  bot._client._blockSequence = 8
  bot.heldItem = held ? { name: held } : null
  bot.getControlState = () => crouching
  return bot
}

function receive (bot, name, data = {}) {
  bot._client.emit('packet', data, { name })
}

test('free slots come from the open menu, not the top of it', () => {
  const window = { inventoryStart: 54, inventoryEnd: 90, slots: [...Array(54).fill(null), { name: 'bone' }, ...Array(35).fill(null)] }
  assert.equal(freeSlotsIn(window), 35)
})

test('a right-click the server never processed is reported as unacknowledged', () => {
  const bot = fakeBot()
  const clicks = watchRightClicks(bot)

  receive(bot, 'acknowledge_player_digging', { sequenceId: 4 })

  assert.equal(clicks.explain(), 'server did not acknowledge the clicks; 0 window(s) opened, 0 closed; server said nothing; holding nothing; standing')
  clicks.stop()
})

test('a right-click the server processed but ignored shows what it did and said', () => {
  const bot = fakeBot({ held: 'bone', crouching: true })
  const clicks = watchRightClicks(bot)

  receive(bot, 'acknowledge_player_digging', { sequenceId: 8 })
  receive(bot, 'open_window')
  receive(bot, 'close_window')
  receive(bot, 'action_bar', { text: { type: 'string', value: 'This spawner is in use' } })

  assert.equal(clicks.explain(), 'server acknowledged the clicks; 1 window(s) opened, 1 closed; server said: This spawner is in use; holding bone; crouching')
  clicks.stop()
})

test('a restart queue message is recognised as the server restarting', () => {
  const bot = fakeBot()
  const clicks = watchRightClicks(bot)

  assert.equal(clicks.serverRestarting(), false)

  receive(bot, 'action_bar', { text: { type: 'string', value: 'Restart queue position #2' } })

  assert.equal(clicks.serverRestarting(), true)
  clicks.stop()
})

test('watching right-clicks leaves no listeners behind', () => {
  const bot = fakeBot()
  watchRightClicks(bot).stop()

  assert.equal(bot._client.listenerCount('packet'), 0)
  assert.equal(bot.listenerCount('messagestr'), 0)
})
