const { SpawnerWontOpenError } = require('../minecraft/spawner')

const REJOIN = 'rejoin'
const STUCK = 'stuck'

function createSpawnerRecovery (open) {
  let due = null
  let rejoined = false
  let alerted = false

  function planNextStep () {
    if (!rejoined) due = REJOIN
    else if (!alerted) due = STUCK
  }

  return {
    async open (bot) {
      try {
        await open(bot)
      } catch (err) {
        if (err instanceof SpawnerWontOpenError) planNextStep()
        throw err
      }

      rejoined = false
      alerted = false
    },

    nextStep () {
      const step = due
      due = null

      if (step === REJOIN) rejoined = true
      if (step === STUCK) alerted = true

      return step
    }
  }
}

module.exports = { createSpawnerRecovery, REJOIN, STUCK }
