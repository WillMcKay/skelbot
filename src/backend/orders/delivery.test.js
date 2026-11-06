const test = require('node:test')
const assert = require('node:assert/strict')
const { chooseOrder, findOrder } = require('./delivery')
const { MOST_PER_ITEM, selectFilter } = require('../minecraft/menu')
const pages = require('./fixtures/order-pages.json')

const lore = (...lines) => lines.map(text => JSON.stringify({ text }))
const orderItem = (price, progress) => ({ name: 'bone', customLore: lore(`$ ${price} each`, `${progress} Delivered`) })
const orderWindow = (...items) => ({ inventoryStart: 54, slots: [...items, ...Array(54 - items.length).fill(null)] })
const line = (text, color = 'gray') => ({ value: { color: { value: color }, text: { value: text } } })

function filterItem (selected) {
  const options = [MOST_PER_ITEM, 'Most Paid', 'Recently Listed']
  return {
    name: 'hopper',
    components: [{ type: 'lore', data: options.map(option => line(option, option === selected ? 'white' : 'dark_gray')) }]
  }
}

function windowFor (rows, page, selected) {
  const slots = Array(54).fill(null)

  for (const { slot, id, count, lore } of rows[page]) {
    slots[slot] = { name: id, count, customLore: lore.map(text => JSON.stringify({ text })) }
  }

  slots[47] = filterItem(selected)
  if (page < rows.length - 1) slots[53] = { name: 'arrow' }

  return { title: `Orders (Page ${page + 1})`, inventoryStart: 54, slots }
}

function menuBot (rows, selected = MOST_PER_ITEM) {
  const listeners = []
  let page = 0

  return {
    clicks: [],
    currentWindow: windowFor(rows, 0, selected),
    on (_, listener) { listeners.push(listener) },
    removeListener () {},
    async clickWindow (slot) {
      this.clicks.push(slot)
      if (slot === 53) page += 1
      if (slot === 47) selected = MOST_PER_ITEM
      this.currentWindow = windowFor(rows, page, selected)
      listeners.splice(0).forEach(listener => listener(this.currentWindow))
    }
  }
}

test('finds the best bone order on page 4, past the bone blocks', async () => {
  const bot = menuBot(pages.bones)
  const order = await findOrder(bot, 'bone', 238, new Set())

  assert.equal(order.price, 165)
  assert.equal(order.slot, 17)
  assert.deepEqual(bot.clicks, [53, 53, 53])
})

test('finds the best arrow order on page 3, past the tipped arrows', async () => {
  const bot = menuBot(pages.arrows)
  const order = await findOrder(bot, 'arrow', 119, new Set())

  assert.equal(order.price, 3.61)
  assert.deepEqual(bot.clicks, [53, 53])
})

test('only ever clicks next page while searching', async () => {
  const bot = menuBot(pages.bones)
  await findOrder(bot, 'diamond', 1, new Set())

  assert.ok(bot.clicks.every(slot => slot === 53))
})

test('skips an order that refused the delivery', async () => {
  const order = await findOrder(menuBot(pages.bones), 'bone', 238, new Set(['$165 each for 5000000']))

  assert.equal(order.price, 159)
})

test('moves the menu to Most Per Item before reading', async () => {
  const bot = menuBot(pages.bones, 'Most Paid')

  assert.equal(await selectFilter(bot, MOST_PER_ITEM), true)
  assert.deepEqual(bot.clicks, [47])
})

test('deliveries take the best order on the page', () => {
  assert.equal(chooseOrder(orderWindow(orderItem('157', '1m/10m'), orderItem('158', '1m/10m')), 'bone', 10).slot, 1)
})
