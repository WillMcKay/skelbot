const { sleep } = require('../utils/sleep')
const { countItem, loreOf } = require('../minecraft/inventory')
const {
  windowTitleText,
  windowTitleIncludes,
  closeAllWindows,
  closeWindowTwice,
  waitForNextWindow
} = require('../minecraft/windows')
const { getLastDeliveryIncome, resetLastDeliveryIncome } = require('../economy/income')
const { recordSale } = require('../economy/profits')
const { listenToServer } = require('../minecraft/chat')
const { MOST_PAID, firstPageWith, listedItems, openMenu, selectFilter } = require('../minecraft/menu')
const { parseOrder } = require('./parse')

const WINDOW_TIMEOUT_MS = 12000
const CONFIRM_SLOT = 15
const DELIVER_TITLE = 'deliver items'
const CONFIRM_TITLE = 'confirm delivery'
const MAX_ORDERS_PER_RUN = 30
const MAX_REFUSED_ORDERS = 3
const MAX_ORDER_PAGES = 30

async function awaitWindow (windowPromise, failMessage) {
  try {
    return await windowPromise
  } catch {
    console.log(`[ORDER] ${failMessage}`)
    return null
  }
}

function readOrder (item) {
  const order = parseOrder(loreOf(item))
  if (!order) return null

  return {
    key: `$${order.price} each for ${order.total}`,
    price: order.price,
    remaining: order.remaining
  }
}

function chooseOrder (window, itemName, amount, skip = new Set()) {
  const matches = listedItems(window)
    .filter(({ item }) => item === itemName)
    .map(({ slot, source }) => ({ slot, key: `slot ${slot}`, ...readOrder(source) }))
    .filter(order => !skip.has(order.key))

  const open = matches
    .filter(order => order.remaining > 0)
    .sort((a, b) => b.price - a.price)

  return open.find(order => order.remaining >= amount) ?? open[0] ??
    matches.find(order => order.price === undefined) ?? null
}

function findOrder (bot, item, amount, skip, signal) {
  return firstPageWith(bot, window => chooseOrder(window, item, amount, skip), { maxPages: MAX_ORDER_PAGES, signal })
}

async function tryClick (bot, slot, mode, description) {
  try {
    await bot.clickWindow(slot, 0, mode)
    return true
  } catch (err) {
    console.log(`[ORDER] Failed to click ${description} slot ${slot}: ${err.message}`)
    return false
  }
}

async function moveItemsIntoDelivery (bot, itemName, signal) {
  let moved = 0

  while (bot.currentWindow) {
    const window = bot.currentWindow

    if (!windowTitleIncludes(window, DELIVER_TITLE)) {
      console.log(`[ORDER] Stopped moving because current window is not Deliver Items: ${windowTitleText(window)}`)
      break
    }

    const start = window.inventoryStart ?? 36

    const slot = window.slots.findIndex((item, index) =>
      index >= start && item?.name === itemName
    )

    if (slot === -1) break

    console.log(`[ORDER] Moving ${itemName} from slot ${slot}`)

    if (!await tryClick(bot, slot, 1, itemName)) break

    moved++
    await sleep(700, signal)
  }

  return moved
}

async function fillOneOrder (bot, { item, command }, signal, skip) {
  resetLastDeliveryIncome()

  let server = null
  let chosen = null

  try {
    await closeAllWindows(bot)

    const beforeCount = countItem(bot, item)

    if (beforeCount <= 0) {
      console.log(`[ORDER] No ${item} in inventory.`)
      return chosen
    }

    console.log(`[ORDER] Opening ${command}`)

    const orderWindow = await awaitWindow(
      openMenu(bot, command, { timeoutMs: WINDOW_TIMEOUT_MS, signal }),
      `No ${item} order window opened. Skipping ${item}.`
    )
    if (!orderWindow) return chosen

    await sleep(700, signal)

    if (!await selectFilter(bot, MOST_PAID, signal)) {
      console.log(`[ORDER] Could not confirm the ${MOST_PAID} filter; not selling ${item} this round.`)
      return chosen
    }

    const order = await findOrder(bot, item, beforeCount, skip, signal)

    if (!order) {
      console.log(`[ORDER] No ${item} order left to try.`)
      return chosen
    }

    chosen = order.key

    const terms = order.price === undefined ? '' : ` ($${order.price} each, ${Math.floor(order.remaining)} still wanted)`
    console.log(`[ORDER] Clicking ${item} order in slot ${order.slot}${terms}`)

    if (!await tryClick(bot, order.slot, 0, 'order')) return chosen

    const deliverWindow = await awaitWindow(
      waitForNextWindow(bot, WINDOW_TIMEOUT_MS),
      `No ${item} delivery window opened.`
    )

    if (!deliverWindow) return chosen

    await sleep(800, signal)

    if (!windowTitleIncludes(deliverWindow, DELIVER_TITLE)) {
      console.log(`[ORDER] Expected Deliver Items window, got: ${windowTitleText(deliverWindow)}`)
      return chosen
    }

    const moved = await moveItemsIntoDelivery(bot, item, signal)

    if (moved <= 0) {
      console.log(`[ORDER] No ${item} moved.`)
      return chosen
    }

    await sleep(700, signal)

    console.log('[ORDER] Closing Deliver Items window with ESC.')

    try {
      bot.closeWindow(bot.currentWindow || deliverWindow)
    } catch {}

    const confirmWindow = await awaitWindow(
      waitForNextWindow(bot, WINDOW_TIMEOUT_MS),
      `No ${item} confirm window opened.`
    )

    if (!confirmWindow) return chosen

    await sleep(800, signal)

    if (!windowTitleIncludes(confirmWindow, CONFIRM_TITLE)) {
      console.log(`[ORDER] Expected Confirm Delivery window, got: ${windowTitleText(confirmWindow)}`)
      return chosen
    }

    console.log(`[ORDER] Clicking green confirm pane slot ${CONFIRM_SLOT}`)

    server = listenToServer(bot)

    if (!await tryClick(bot, CONFIRM_SLOT, 0, 'confirm')) return chosen

    await sleep(2500, signal)

    console.log('[ORDER] Closing all GUIs after confirm.')

    await closeWindowTwice(bot)
    await sleep(1200, signal)

    if (!getLastDeliveryIncome() && countItem(bot, item) >= beforeCount) {
      console.log(`[ORDER] Delivery to the ${chosen} ${item} order didn't go through; ${server.explain()}`)
    }

    return chosen
  } finally {
    server?.stop()
    await closeAllWindows(bot)
  }
}

async function fillOrdersUntilEmpty (bot, order, signal) {
  const refused = new Set()
  let sold = 0

  for (let attempt = 0; attempt < MAX_ORDERS_PER_RUN && refused.size < MAX_REFUSED_ORDERS && countItem(bot, order.item) > 0; attempt++) {
    const before = countItem(bot, order.item)
    const chosen = await fillOneOrder(bot, order, signal, refused)

    if (!chosen) break

    const delivered = before - countItem(bot, order.item)

    if (delivered > 0) {
      sold += delivered
      recordSale(order.item, delivered, getLastDeliveryIncome())
    } else {
      refused.add(chosen)
    }

    await sleep(4000, signal)
  }

  console.log(`[ORDER] Sold ${sold} ${order.item}${sold === 1 ? '' : 's'}, ${countItem(bot, order.item)} left.`)

  return sold
}

module.exports = { chooseOrder, findOrder, fillOrdersUntilEmpty }
