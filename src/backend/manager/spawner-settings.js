const { InputError } = require('./errors')

const DEFAULT_SPAWNER = { cycleMinutes: 5 }
const MAX_CYCLE_MINUTES = 120

function validCycleMinutes (value) {
  const minutes = Number(value)
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_CYCLE_MINUTES) {
    throw new InputError(`Collect every must be between 1 and ${MAX_CYCLE_MINUTES} minutes.`)
  }
  return minutes
}

function defaultSpawner () {
  return { ...DEFAULT_SPAWNER }
}

module.exports = { defaultSpawner, validCycleMinutes }
