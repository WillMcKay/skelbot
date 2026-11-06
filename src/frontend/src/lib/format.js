export function money (value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'

  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}b`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}m`
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}k`
  return `${sign}$${Math.round(abs)}`
}

export function shortMoney (value) {
  return money(value).replace(/\.0+([kmb])$/, '$1').replace(/\.\dk$/, 'k')
}

const MONEY_UNITS = { k: 1e3, m: 1e6, b: 1e9 }

export function parseMoney (text) {
  const match = String(text ?? '').trim().toLowerCase().match(/^([\d,]*\.?\d*)\s*([kmb])?$/)
  if (!match) return null

  const amount = Number(match[1].replace(/,/g, ''))
  if (!Number.isFinite(amount)) return null

  return amount * (MONEY_UNITS[match[2]] ?? 1)
}

export function moneyInput (value) {
  if (!value) return ''
  if (value % 1e6 === 0) return `${value / 1e6}m`
  if (value % 1e3 === 0) return `${value / 1e3}k`
  return String(value)
}

export function price (value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value < 100 ? `$${value.toFixed(2)}` : money(value)
}

export function count (value) {
  return Math.round(value ?? 0).toLocaleString()
}

export function plural (n, word, many = `${word}s`) {
  return `${count(n)} ${n === 1 ? word : many}`
}

export function hours (value) {
  if (!value) return '0h'
  if (value < 1) return `${Math.round(value * 60)}m`
  if (value < 48) return `${value.toFixed(1)}h`
  return `${Math.round(value / 24)}d`
}

export function clock (at) {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function hourOfDay (at) {
  return new Date(at).toLocaleTimeString([], { hour: 'numeric' })
}

export function since (at) {
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000))
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function place (where) {
  if (!where) return null
  const dimension = where.dimension ? ` · ${where.dimension.replace(/_/g, ' ')}` : ''
  return `${where.x}, ${where.y}, ${where.z}${dimension}`
}
