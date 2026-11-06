const test = require('node:test')
const assert = require('node:assert/strict')
const { InputError } = require('../manager/errors')
const { moduleCatalog, selectModuleIds, withOneActive } = require('.')

test('every module declares what kind it is', () => {
  for (const { id, kind } of moduleCatalog()) assert.ok(['active', 'passive'].includes(kind), id)
})

test('a bot can have one active job or none', () => {
  assert.deepEqual(selectModuleIds(['spawners']), ['spawners'])
  assert.deepEqual(selectModuleIds([]), [])
})

test('add-ons run alongside the job', () => {
  assert.deepEqual(selectModuleIds(['spawners', 'payout', 'stealth']), ['spawners', 'payout', 'stealth'])
  assert.deepEqual(withOneActive(['spawners', 'payout', 'stealth']), ['spawners', 'payout', 'stealth'])
})

test('unknown modules are refused', () => {
  assert.throws(() => selectModuleIds(['nope']), InputError)
})
