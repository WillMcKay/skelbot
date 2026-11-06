const { parseAmount } = require('../utils/text')

const PRICE_LINE = /^\$\s*([\d,.]+)\s*([kmb])?\s*each$/i
const PROGRESS_LINE = /^([\d,.]+)\s*([kmb])?\s*\/\s*([\d,.]+)\s*([kmb])?\s*delivered$/i

function parseOrder (lore) {
  const price = lore.map(line => line.match(PRICE_LINE)).find(Boolean)
  const progress = lore.map(line => line.match(PROGRESS_LINE)).find(Boolean)
  if (!price || !progress) return null

  const total = parseAmount(progress[3], progress[4])

  return {
    price: parseAmount(price[1], price[2]),
    total,
    remaining: total - parseAmount(progress[1], progress[2])
  }
}

module.exports = { parseOrder }
