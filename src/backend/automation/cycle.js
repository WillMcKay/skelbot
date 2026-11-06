const config = require('../config')
const { notify } = require('../notifier')
const { sleep } = require('../utils/sleep')
const { getBot, rejoinMinecraftBot } = require('../minecraft/connection')
const { closeAllWindows } = require('../minecraft/windows')
const { countItem } = require('../minecraft/inventory')
const { restackSpawners, openNearestSpawner, takeItemFromSpawner } = require('../minecraft/spawner')
const { fillOrdersUntilEmpty } = require('../orders/delivery')
const { runExclusive } = require('../minecraft/activity')
const { createSpawnerRecovery, REJOIN, STUCK } = require('./spawner-recovery')

function itemList (counts) {
  const parts = Object.entries(counts ?? {})
    .filter(([, n]) => n > 0)
    .map(([item, n]) => `${n} ${item}${n === 1 ? '' : 's'}`)
  return parts.join(', ') || 'nothing'
}

let running = null
let lastError = null

const spawnerRecovery = createSpawnerRecovery(openNearestSpawner)

function isBusy () {
  return running !== null
}

async function collectFromSpawner (bot, orders, signal) {
  const restacked = await restackSpawners(bot)
  if (restacked) console.log(`[AUTO] Put ${restacked} spawner(s) back into the stack.`)

  await spawnerRecovery.open(bot)
  await sleep(800, signal)

  const taken = {}

  for (const { item } of orders) {
    taken[item] = await takeItemFromSpawner(bot, item, signal)
  }

  return taken
}

async function cycle (bot, signal) {
  const orders = Object.values(config.orders)

  try {
    console.log('[AUTO] Cycle started.')

    await closeAllWindows(bot)

    const taken = await collectFromSpawner(bot, orders, signal)
    const sold = {}

    await closeAllWindows(bot)

    for (const order of orders) {
      sold[order.item] = countItem(bot, order.item) > 0
        ? await fillOrdersUntilEmpty(bot, order, signal)
        : 0
    }

    signal.throwIfAborted()

    console.log(`[AUTO] Cycle finished: took ${itemList(taken)}; sold ${itemList(sold)}.`)
    lastError = null

    return { taken, sold }
  } catch (err) {
    if (signal.aborted) {
      console.log('[AUTO] Cycle stopped.')
      return null
    }

    console.error(err)

    if (err.message !== lastError) {
      lastError = err.message
      notify({ event: 'cycle-failed', title: 'Cycle failed', description: err.message, level: 'error' })
    }

    return null
  } finally {
    await closeAllWindows(bot)
  }
}

async function recoverSpawner () {
  const step = spawnerRecovery.nextStep()

  if (step === REJOIN) {
    await rejoinMinecraftBot('The spawner would not open, so the bot is rejoining.')
  }

  if (step === STUCK) {
    notify({
      event: 'spawner-stuck',
      title: 'Spawner still will not open',
      description: 'Rejoining did not help. The bot keeps retrying each cycle but will not rejoin again until the spawner has opened.',
      level: 'alert'
    })
  }
}

async function runBoneCycle () {
  if (running) return null

  const bot = getBot()

  if (!bot) {
    console.log('[AUTO] Skipped cycle: Minecraft bot is not connected.')
    return null
  }

  const controller = new AbortController()
  running = { controller, done: runExclusive(() => cycle(bot, controller.signal)) }

  try {
    const result = await running.done
    if (!controller.signal.aborted) await recoverSpawner()
    return result
  } finally {
    running = null
  }
}

async function stopBoneCycle () {
  if (!running) return

  running.controller.abort()
  await running.done
}

module.exports = { isBusy, runBoneCycle, stopBoneCycle }
