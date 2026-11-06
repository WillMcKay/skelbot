const test = require('node:test')
const assert = require('node:assert/strict')
const { InputError } = require('./errors')
const { defaultSpawner, validCycleMinutes } = require('./spawner-settings')

test('new bots collect every 5 minutes', () => {
  assert.deepEqual(defaultSpawner(), { cycleMinutes: 5 })
})

test('collect time must be whole minutes in range', () => {
  assert.equal(validCycleMinutes('15'), 15)
  for (const value of [0, 121, 1.5, 'soon', '']) assert.throws(() => validCycleMinutes(value), InputError)
})
