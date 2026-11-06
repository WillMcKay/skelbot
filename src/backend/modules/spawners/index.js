const { notify } = require('../../notifier')
const { parseBalance, updateBalance } = require('../../economy/balance')
const { handleDeliveryMessage } = require('../../economy/income')
const { startAutoBones } = require('../../automation/autoBones')
const { packUpSpawners } = require('../../automation/packUp')
const { moveToBlockCenter } = require('../../minecraft/movement')
const { startProfitReports, stopProfitReports, summaryFields } = require('../../reports/profitReports')
const { watchTeleportsAndDeaths } = require('../../automation/teleport')
const { commands } = require('./commands')
const { snapshot } = require('./state')

module.exports = {
  id: 'spawners',
  name: 'Spawner farming',
  description: 'Collects bones and arrows, fulfills orders, and tracks profits.',
  kind: 'active',
  enabledByDefault: true,
  commands,

  create () {
    let autoStarted = false

    return {
      snapshot,
      start: startProfitReports,

      async onSpawn (bot) {
        watchTeleportsAndDeaths(bot)

        await updateBalance()
        notify({ event: 'connected', title: 'Connected', description: `Playing as ${bot.username}.`, fields: summaryFields() })

        if (!await moveToBlockCenter(bot)) console.log('[MC] Could not reach the middle of the block; carrying on from here.')

        if (!autoStarted) {
          autoStarted = true
          startAutoBones().catch(err => console.error('[MODULE spawners] Could not start automation:', err))
        }
      },

      onChat (message) {
        parseBalance(message)
        handleDeliveryMessage(message)
      },

      async shutdown () {
        stopProfitReports()
        await packUpSpawners()
      }
    }
  }
}
