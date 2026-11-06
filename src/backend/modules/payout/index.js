const { parseBalance } = require('../../economy/balance')
const { payOutBalance } = require('../../economy/income')
const { runExclusive } = require('../../minecraft/activity')
const { getBot } = require('../../minecraft/connection')

const CHECK_EVERY_MS = 60 * 1000

module.exports = {
  id: 'payout',
  name: 'Auto payout',
  description: 'Sends earnings to another player, with a threshold and an amount to keep.',
  kind: 'passive',
  enabledByDefault: false,

  create () {
    let timer = null

    async function check () {
      if (!getBot()) return

      try {
        await runExclusive(payOutBalance)
      } catch (err) {
        console.error('[PAYOUT]', err.message)
      }
    }

    return {
      onSpawn () {
        if (timer) return

        timer = setInterval(check, CHECK_EVERY_MS)
      },

      onChat (message) {
        parseBalance(message)
      },

      shutdown () {
        clearInterval(timer)
      }
    }
  }
}
