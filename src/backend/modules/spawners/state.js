const config = require('../../config')
const { getBot } = require('../../minecraft/connection')
const { countItem } = require('../../minecraft/inventory')
const { placedSpawners, stacksForSpawners } = require('../../minecraft/spawner-count')
const { getBalance } = require('../../economy/balance')
const { getLastDeliveryIncome } = require('../../economy/income')
const { getProfits, getRates, itemStats, getHourlyHistory, salesOf } = require('../../economy/profits')
const { isBusy } = require('../../automation/cycle')
const { isAutoBonesEnabled } = require('../../automation/autoBones')

function snapshot () {
  const bot = getBot()
  const orders = Object.values(config.orders)

  return {
    autoBones: isAutoBonesEnabled(),
    spawners: { placed: placedSpawners(), stacks: stacksForSpawners(placedSpawners()) },
    cycleRunning: isBusy(),
    balance: getBalance(),
    lastIncome: getLastDeliveryIncome(),
    profits: getProfits(),
    rates: getRates(),
    history: getHourlyHistory(),
    orders: orders.map(({ item, label }) => ({
      item,
      label,
      inInventory: countItem(bot, item),
      soldToday: salesOf(item),
      ...itemStats(item)
    }))
  }
}

module.exports = { snapshot }
