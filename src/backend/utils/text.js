const SUFFIX_MULTIPLIERS = {
  k: 1000,
  m: 1000000,
  b: 1000000000
}

const AMOUNT = String.raw`\$?\s*([\d,.]+)\s*([kmb])?(?![a-z])`

function strip (text) {
  return String(text)
    .replace(/§./g, '')
    .replace(/[^\x20-\x7E]/g, '')
}

function parseAmount (num, suffix) {
  const value = Number(String(num).replace(/,/g, ''))
  const multiplier = SUFFIX_MULTIPLIERS[suffix?.toLowerCase()] || 1

  return value * multiplier
}

function parseNumberWithSuffix (num, suffix) {
  return Math.floor(parseAmount(num, suffix))
}

function money (value) {
  if (value === null || value === undefined) return 'N/A'
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}b`
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}m`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${Math.floor(value)}`
}

function price (value) {
  return value >= 1000 ? money(value) : `$${value.toFixed(2)}`
}

function duration (ms) {
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days) return `${days}d ${hours % 24}h`
  if (hours) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

function lines (...rows) {
  return rows.flat().join('\n')
}

module.exports = { AMOUNT, strip, parseAmount, parseNumberWithSuffix, money, price, duration, lines }
