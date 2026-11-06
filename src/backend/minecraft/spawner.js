const { sleep } = require('../utils/sleep')
const { closeAllWindows, waitForNextWindow } = require('./windows')
const { countItem } = require('./inventory')
const { addPlacedSpawners, clearPlacedSpawners, placedSpawners, stacksForSpawners } = require('./spawner-count')
const { equipBestPickaxe } = require('./tools')
const { breakBlock } = require('./digging')
const { activateBlockVanilla, placeOnBlockVanilla } = require('../evasion/interact')
const { spotInFront, placeHeld } = require('./placement')
const { waitUntil, whileCrouched } = require('./movement')
const { listenToServer } = require('./chat')

const SPAWNER_WINDOW_TIMEOUT_MS = 5000
const SPAWNER_OPEN_ATTEMPTS = 2
const PICKUP_TIMEOUT_MS = 1500
const RESTART_QUEUE = /restart queue/i

class SpawnerWontOpenError extends Error {}

function freeSlotsIn (window) {
  return window.slots.slice(window.inventoryStart, window.inventoryEnd ?? window.slots.length).filter(item => !item).length
}

function findSpawner (bot) {
  return bot.findBlock({
    matching: b => b && b.name === 'spawner',
    maxDistance: 6
  })
}

function watchRightClicks (bot) {
  const client = bot._client
  const server = listenToServer(bot)
  const windows = { opened: 0, closed: 0 }
  let acknowledged = null

  const onPacket = (data, { name }) => {
    if (name === 'acknowledge_player_digging') acknowledged = data.sequenceId
    if (name === 'open_window') windows.opened++
    if (name === 'close_window') windows.closed++
  }

  client.on('packet', onPacket)

  return {
    stop: () => {
      client.removeListener('packet', onPacket)
      server.stop()
    },
    serverRestarting: () => server.heard(RESTART_QUEUE),
    explain: () => [
      acknowledged === client._blockSequence ? 'server acknowledged the clicks' : 'server did not acknowledge the clicks',
      `${windows.opened} window(s) opened, ${windows.closed} closed`,
      server.explain(),
      `holding ${bot.heldItem?.name ?? 'nothing'}`,
      bot.getControlState('sneak') ? 'crouching' : 'standing'
    ].join('; ')
  }
}

async function openNearestSpawner (bot) {
  await closeAllWindows(bot)

  const block = findSpawner(bot)

  if (!block) {
    const { x, y, z } = bot.entity.position.floored()
    throw new Error(`No nearby spawner found at ${x}, ${y}, ${z}.`)
  }

  const clicks = watchRightClicks(bot)

  try {
    for (let attempt = 1; attempt <= SPAWNER_OPEN_ATTEMPTS; attempt++) {
      const windowPromise = waitForNextWindow(bot, SPAWNER_WINDOW_TIMEOUT_MS)
      windowPromise.catch(() => {})

      await activateBlockVanilla(bot, block)

      try {
        return await windowPromise
      } catch {
        console.log(`[SPAWNER] No window after right-click ${attempt} of ${SPAWNER_OPEN_ATTEMPTS}.`)
      }
    }

    if (clicks.serverRestarting()) {
      throw new Error('The server is restarting, so the spawner cannot open. Staying connected; the next cycle tries again.')
    }

    const distance = bot.entity.position.offset(0, bot.entity.eyeHeight ?? 1.62, 0)
      .distanceTo(block.position.offset(0.5, 0.5, 0.5))
      .toFixed(1)

    throw new SpawnerWontOpenError(`Spawner at ${block.position} (${distance} blocks away) did not open a window after ${SPAWNER_OPEN_ATTEMPTS} right-clicks: ${clicks.explain()}.`)
  } finally {
    clicks.stop()
  }
}

async function takeItemFromSpawner (bot, itemName, signal) {
  const window = bot.currentWindow
  if (!window) throw new Error('Spawner window closed before items could be taken.')

  let taken = 0

  for (let slot = 0; slot < window.inventoryStart; slot++) {
    const item = window.slots[slot]
    if (!item || item.name !== itemName) continue

    if (freeSlotsIn(window) <= stacksForSpawners(placedSpawners())) {
      console.log('[AUTO] Stopped taking items to keep room for the spawners.')
      break
    }

    await bot.clickWindow(slot, 0, 1)
    taken += item.count
    await sleep(400, signal)
  }

  return taken
}

async function restackSpawners (bot) {
  const total = countItem(bot, 'spawner')
  if (total === 0) return 0

  try {
    await placeSpawners(bot)
  } finally {
    addPlacedSpawners(total - countItem(bot, 'spawner'))
  }

  return total - countItem(bot, 'spawner')
}

async function placeSpawners (bot) {
  if (!findSpawner(bot)) await placeHeld(bot, 'spawner', [spotInFront(bot, 0), spotInFront(bot, 1)])

  if (!spawnerStackInInventory(bot)) return

  const block = findSpawner(bot)

  await whileCrouched(bot, async () => {
    for (let item = spawnerStackInInventory(bot); item; item = spawnerStackInInventory(bot)) {
      const before = countItem(bot, 'spawner')

      await bot.equip(item, 'hand')
      await placeOnBlockVanilla(bot, block)

      if (!await waitUntil(bot, () => countItem(bot, 'spawner') < before, PICKUP_TIMEOUT_MS)) {
        throw new Error(`Could not add spawners to the spawner at ${block.position}; ${before} still in the inventory.`)
      }
    }
  })
}

function spawnerStackInInventory (bot) {
  return bot.inventory.items().find(item => item.name === 'spawner')
}

async function pickUpSpawners (bot) {
  if (!findSpawner(bot)) return 0
  if (!await equipBestPickaxe(bot)) throw new Error('No pickaxe in inventory.')

  const start = countItem(bot, 'spawner')

  await whileCrouched(bot, async () => {
    for (let block = findSpawner(bot); block; block = findSpawner(bot)) {
      await breakBlock(bot, block)
    }

    await waitUntil(bot, () => countItem(bot, 'spawner') > start, PICKUP_TIMEOUT_MS)
  })

  const picked = countItem(bot, 'spawner') - start
  if (picked <= 0) throw new Error('The spawners were mined but did not reach the inventory.')

  clearPlacedSpawners()
  return picked
}

module.exports = { SpawnerWontOpenError, restackSpawners, openNearestSpawner, takeItemFromSpawner, pickUpSpawners, freeSlotsIn, watchRightClicks }
