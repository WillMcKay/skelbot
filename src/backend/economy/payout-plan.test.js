const test = require('node:test')
const assert = require('node:assert/strict')
const { payableAmount } = require('./payout-plan')

test('with no settings it pays the whole balance', () => {
  assert.equal(payableAmount(1000.9), 1000)
})

test('waits until the balance reaches the threshold', () => {
  assert.equal(payableAmount(999, { minBalance: 1000 }), 0)
  assert.equal(payableAmount(1000, { minBalance: 1000 }), 1000)
})

test('leaves the amount to keep on the bot', () => {
  assert.equal(payableAmount(1500, { keep: 400 }), 1100)
})

test('never pays out of the amount to keep', () => {
  assert.equal(payableAmount(300, { keep: 400 }), 0)
})

test('threshold and keep work together', () => {
  assert.equal(payableAmount(900, { minBalance: 1000, keep: 100 }), 0)
  assert.equal(payableAmount(1000, { minBalance: 1000, keep: 100 }), 900)
})
