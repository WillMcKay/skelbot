const { sleep } = require('../utils/sleep')
const { loreOf } = require('./inventory')
const { waitForNextWindow, windowTitleText } = require('./windows')

const LIST_SLOTS = 45
const FILTER_SLOT = 47
const FILTER_ITEM = 'hopper'
const FILTER_OPTIONS = 4
const NEXT_PAGE_SLOT = 53
const NEXT_PAGE_ITEM = 'arrow'
const SELECTED_COLOR = 'white'

const OPEN_MS = 6000
const CONTROL_MS = 2500
const OPEN_SETTLE_MS = 150
const FILTER_SETTLE_MS = 900
const PAGE_SETTLE_MS = 400

const MOST_PAID = 'Most Paid'
const MOST_PER_ITEM = 'Most Per Item'

function listedItems (window) {
  return window.slots.slice(0, LIST_SLOTS).flatMap((item, slot) => item
    ? [{ slot, item: item.name, count: item.count, lore: loreOf(item), source: item }]
    : [])
}

async function openMenu (bot, command, { timeoutMs = OPEN_MS, signal } = {}) {
  const opened = waitForNextWindow(bot, timeoutMs)
  bot.chat(command)
  await opened
  await sleep(OPEN_SETTLE_MS, signal)

  return bot.currentWindow
}

function selectedFilter (item) {
  const lines = item.components?.find(component => component.type === 'lore')?.data ?? []
  const parts = lines.flatMap(line => [line.value, ...(line.value?.extra?.value?.value ?? [])])
  const selected = parts.find(part => part?.color?.value === SELECTED_COLOR)

  return selected?.text?.value ?? ''
}

async function selectFilter (bot, wanted, signal) {
  for (let click = 0; click <= FILTER_OPTIONS; click++) {
    const filter = bot.currentWindow?.slots[FILTER_SLOT]
    if (filter?.name !== FILTER_ITEM) return false
    if (selectedFilter(filter).includes(wanted)) return true
    if (click === FILTER_OPTIONS) return false

    const reopened = waitForNextWindow(bot, CONTROL_MS).catch(() => null)
    await bot.clickWindow(FILTER_SLOT, 0, 0)
    await reopened
    await sleep(FILTER_SETTLE_MS, signal)
  }

  return false
}

async function nextPage (bot, signal) {
  const window = bot.currentWindow
  if (window?.slots[NEXT_PAGE_SLOT]?.name !== NEXT_PAGE_ITEM) return false

  const before = windowTitleText(window)
  const reopened = waitForNextWindow(bot, CONTROL_MS).catch(() => null)
  await bot.clickWindow(NEXT_PAGE_SLOT, 0, 0)
  await reopened
  await sleep(PAGE_SETTLE_MS, signal)

  return windowTitleText(bot.currentWindow) !== before
}

async function firstPageWith (bot, pick, { maxPages, signal }) {
  for (let page = 1; page <= maxPages; page++) {
    const found = pick(bot.currentWindow)
    if (found) return found
    if (!await nextPage(bot, signal)) break
  }

  return null
}

module.exports = {
  MOST_PAID,
  MOST_PER_ITEM,
  listedItems,
  openMenu,
  selectedFilter,
  selectFilter,
  nextPage,
  firstPageWith
}
