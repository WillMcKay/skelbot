const test = require('node:test')
const assert = require('node:assert/strict')
const { staleSessionDelay } = require('./connection')

const ALREADY_ONLINE = 'You are already online\nYou are connected to proxy: b6e6685bca06\nConnect reason: proxy request-join-cache login'

test('an old session left behind by a dropped connection is retried', () => {
  assert.equal(staleSessionDelay(ALREADY_ONLINE, { joined: true, retries: 0 }), 15000)
})

test('the retries wait longer each time', () => {
  const delays = [0, 1, 2, 3, 4, 5].map(retries => staleSessionDelay(ALREADY_ONLINE, { joined: true, retries }))

  assert.deepEqual(delays, [15000, 30000, 60000, 120000, 240000, 300000])
})

test('it gives up once the session clearly is not going away', () => {
  assert.equal(staleSessionDelay(ALREADY_ONLINE, { joined: true, retries: 6 }), null)
})

test('being refused on the first join means something else has the account', () => {
  assert.equal(staleSessionDelay(ALREADY_ONLINE, { joined: false, retries: 0 }), null)
})

test('other kicks still stop the bot', () => {
  assert.equal(staleSessionDelay('Your IP has been involved with illegal activity.', { joined: true, retries: 0 }), null)
})
