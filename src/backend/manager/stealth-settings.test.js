const test = require('node:test')
const assert = require('node:assert/strict')
const { InputError } = require('./errors')
const { defaultStealth, validStealthRadius, validStealthWhitelist } = require('./stealth-settings')

test('new bots whitelist MineProbe', () => {
  assert.deepEqual(defaultStealth(), { stealthRadius: 20, stealthWhitelist: ['MineProbe'] })
})

test('rejects distances out of range', () => {
  for (const value of [0, -5, 500, 'far']) assert.throws(() => validStealthRadius(value), InputError)
  assert.equal(validStealthRadius('100'), 100)
})

test('whitelist drops duplicates and refuses bad names', () => {
  assert.deepEqual(validStealthWhitelist(['MineProbe', 'mineprobe', ' Steve ']), ['MineProbe', 'Steve'])
  assert.throws(() => validStealthWhitelist(['not a name']), InputError)
  assert.throws(() => validStealthWhitelist('MineProbe'), InputError)
})
