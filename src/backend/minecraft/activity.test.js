const test = require('node:test')
const assert = require('node:assert/strict')
const { runExclusive } = require('./activity')

const tick = ms => new Promise(resolve => setTimeout(resolve, ms))

test('tasks never overlap', async () => {
  const events = []
  const task = name => async () => {
    events.push(`${name} start`)
    await tick(5)
    events.push(`${name} end`)
  }

  await Promise.all([runExclusive(task('job')), runExclusive(task('payout'))])

  assert.deepEqual(events, ['job start', 'job end', 'payout start', 'payout end'])
})

test('a failed task passes on its error and frees the lock', async () => {
  await assert.rejects(runExclusive(async () => { throw new Error('boom') }), /boom/)
  assert.equal(await runExclusive(async () => 'next'), 'next')
})
