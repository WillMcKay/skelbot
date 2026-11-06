const config = require('../../config')
const { getBot } = require('../../minecraft/connection')
const { countItem } = require('../../minecraft/inventory')
const { isBusy, runBoneCycle } = require('../../automation/cycle')
const { updateBalance } = require('../../economy/balance')

function cycleResult ({ taken, sold }) {
  const orders = Object.values(config.orders)
  const left = item => countItem(getBot(), item)
  const stalled = orders.some(({ item }) => left(item) > 0 && !sold[item])

  return {
    event: 'cycle-finished',
    title: 'Cycle finished',
    level: stalled ? 'warning' : 'info',
    fields: Object.fromEntries(orders.flatMap(({ item, label }) => [
      [`${label}s taken`, taken[item]],
      [`${label}s sold`, sold[item]],
      [`${label}s left`, left(item)]
    ]))
  }
}

const commands = {
  async refresh () {
    await updateBalance()
  },

  async cycle (reply) {
    if (isBusy()) return reply({ title: 'A cycle is already running' })

    const result = await runBoneCycle()
    if (result) reply(cycleResult(result))
  }
}

module.exports = { commands }
