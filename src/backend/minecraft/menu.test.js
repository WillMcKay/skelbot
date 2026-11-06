const test = require('node:test')
const assert = require('node:assert/strict')
const { nextPage, selectFilter, selectedFilter } = require('./menu')

test('reads the selected filter from its white line', () => {
  const line = (color, text) => ({ value: { color: { value: color }, text: { value: text } } })
  const filter = { components: [{ type: 'lore', data: [line('gray', 'Click to change'), line('dark_gray', 'Lowest Price'), line('white', 'Recently Listed')] }] }
  assert.equal(selectedFilter(filter), 'Recently Listed')
})

test('reads the selected filter when the text is nested, as on /order', () => {
  const part = (color, text) => ({ color: { value: color }, text: { value: text } })
  const line = (color, text) => ({ value: { text: { value: '' }, extra: { value: { value: [part(color, text)] } } } })
  const filter = { components: [{ type: 'lore', data: [line('gray', 'Click to change'), line('dark_gray', 'Most Per Item'), line('white', 'Most Paid')] }] }
  assert.equal(selectedFilter(filter), 'Most Paid')
})

test('selectFilter clicks until the wanted option is selected', async () => {
  const options = ['Most Paid', 'Recently Listed', 'Most Per Item']
  let index = 0
  const hopper = () => ({
    name: 'hopper',
    components: [{ type: 'lore', data: [{ value: { color: { value: 'white' }, text: { value: options[index] } } }] }]
  })
  const listeners = []
  const bot = {
    currentWindow: { slots: Object.assign([], { 47: hopper() }) },
    on (_, listener) { listeners.push(listener) },
    removeListener () {},
    async clickWindow (slot) {
      assert.equal(slot, 47)
      index += 1
      this.currentWindow = { slots: Object.assign([], { 47: hopper() }) }
      listeners.splice(0).forEach(listener => listener(this.currentWindow))
    }
  }

  assert.equal(await selectFilter(bot, 'Most Per Item'), true)
  assert.equal(index, 2)
})

test('selectFilter reports failure when there is no filter', async () => {
  assert.equal(await selectFilter({ currentWindow: { slots: [] } }, 'Most Per Item'), false)
})

test('nextPage only clicks a real next page arrow', async () => {
  let clicked = 0
  const bot = {
    currentWindow: { title: 'Orders (Page 1)', slots: [] },
    async clickWindow () { clicked += 1 }
  }

  assert.equal(await nextPage(bot), false)
  assert.equal(clicked, 0)
})

test('nextPage moves on when the page title changes', async () => {
  const listeners = []
  const page = number => ({ title: `Orders (Page ${number})`, slots: Object.assign([], { 53: { name: 'arrow' } }) })
  const bot = {
    currentWindow: page(1),
    on (_, listener) { listeners.push(listener) },
    removeListener () {},
    async clickWindow (slot) {
      assert.equal(slot, 53)
      this.currentWindow = page(2)
      listeners.splice(0).forEach(listener => listener(this.currentWindow))
    }
  }

  assert.equal(await nextPage(bot), true)
})
