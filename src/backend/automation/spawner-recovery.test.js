const test = require('node:test')
const assert = require('node:assert/strict')
const { SpawnerWontOpenError } = require('../minecraft/spawner')
const { createSpawnerRecovery, REJOIN, STUCK } = require('./spawner-recovery')

const WONT_OPEN = new SpawnerWontOpenError('no window')

function recoveryWith (...results) {
  return createSpawnerRecovery(async () => {
    const result = results.shift()
    if (result instanceof Error) throw result
  })
}

const failedOpen = recovery => assert.rejects(recovery.open({}), SpawnerWontOpenError)

test('a spawner that opens needs no recovery', async () => {
  const recovery = recoveryWith('opened')

  await recovery.open({})

  assert.equal(recovery.nextStep(), null)
})

test('the bot rejoins as soon as the spawner will not open', async () => {
  const recovery = recoveryWith(WONT_OPEN)

  await failedOpen(recovery)

  assert.equal(recovery.nextStep(), REJOIN)
  assert.equal(recovery.nextStep(), null)
})

test('when a rejoin does not help it alerts once instead of rejoining in a loop', async () => {
  const recovery = recoveryWith(WONT_OPEN, WONT_OPEN, WONT_OPEN)

  await failedOpen(recovery)
  assert.equal(recovery.nextStep(), REJOIN)

  await failedOpen(recovery)
  assert.equal(recovery.nextStep(), STUCK)

  await failedOpen(recovery)
  assert.equal(recovery.nextStep(), null)
})

test('once the spawner opens again, a later failure can rejoin again', async () => {
  const recovery = recoveryWith(WONT_OPEN, 'opened', WONT_OPEN)

  await failedOpen(recovery)
  recovery.nextStep()
  await recovery.open({})

  await failedOpen(recovery)
  assert.equal(recovery.nextStep(), REJOIN)
})

test('other failures do not trigger a rejoin', async () => {
  const recovery = recoveryWith(new Error('No nearby spawner found.'))

  await assert.rejects(recovery.open({}), /No nearby spawner/)

  assert.equal(recovery.nextStep(), null)
})
