const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export function statusOf (bot) {
  if (bot.auth) return { tone: 'warning', label: 'Sign-in needed' }

  switch (bot.status) {
    case 'running':
      return bot.state?.connected ? { tone: 'good', label: 'Online' } : { tone: 'warning', label: 'Connecting' }
    case 'stopping':
      return { tone: 'neutral', label: 'Stopping' }
    case 'restarting':
      return { tone: 'critical', label: 'Crashed, restarting' }
    default:
      return { tone: 'neutral', label: 'Stopped' }
  }
}

export const botHref = (id, edit = false) => `#/bots/${id}${edit ? '/edit' : ''}`

export const INVENTORY_SLOTS = 36

export const isOnline = bot => bot.status === 'running' && Boolean(bot.state?.connected)
export const isStopped = bot => bot.status === 'stopped'
const hasModule = (bot, id) => (bot.modules ?? ['spawners']).includes(id)
export const spawnerState = bot => hasModule(bot, 'spawners') ? bot.state?.modules?.spawners : null
export function attentionFor (bot) {
  const href = botHref(bot.id)
  const items = []

  if (bot.auth) items.push({ key: 'auth', tone: 'warning', title: 'Sign in with Microsoft', detail: 'The bot cannot join until you enter the code.', action: 'Sign in', href })
  if (bot.status === 'restarting') items.push({ key: 'crash', tone: 'error', title: 'Crashed and restarting', detail: 'It keeps retrying, with longer waits each time.', action: 'See log', href })
  if (bot.stale) items.push({ key: 'stale', tone: 'info', title: 'Restart to apply changes', detail: 'Saved settings start on the next restart.', action: 'Open', href })

  return items.map(item => ({ ...item, bot }))
}

const hoursInLast24h = (state, now) => (state?.history ?? [])
  .filter(entry => Number.isFinite(entry.profit) && entry.startedAt >= now - DAY_MS)

const profitOf = entries => entries.reduce((total, entry) => total + entry.profit, 0)

export const earnedLast24h = (state, now = Date.now()) => profitOf(hoursInLast24h(state, now))

export function ratePerHour (state, now = Date.now()) {
  const entries = hoursInLast24h(state, now)
  const hoursRun = entries.reduce((total, entry) => total + Math.min((now - entry.startedAt) / HOUR_MS, 1), 0)
  return profitOf(entries) / Math.max(hoursRun, 1)
}

export function fleetHistory (bots, now = Date.now()) {
  const hours = Array.from({ length: 24 }, (_, index) => ({ startedAt: now - (24 - index) * HOUR_MS, profit: 0 }))
  hours[23].current = true

  for (const state of bots.map(spawnerState).filter(Boolean)) {
    for (const entry of hoursInLast24h(state, now)) {
      const hoursAgo = Math.min(Math.floor((now - entry.startedAt) / HOUR_MS), 23)
      hours[23 - hoursAgo].profit += entry.profit
    }
  }

  return hours
}

export function totals (bots) {
  const now = Date.now()
  const states = bots.map(bot => bot.state).filter(Boolean)
  const spawners = bots.map(spawnerState).filter(Boolean)
  const sum = pick => spawners.reduce((total, state) => total + (pick(state) || 0), 0)

  return {
    online: bots.filter(isOnline).length,
    farming: bots.filter(bot => bot.state?.connected && spawnerState(bot)?.autoBones).length,
    last24h: sum(state => earnedLast24h(state, now)),
    perHour: sum(state => ratePerHour(state, now)),
    allTime: sum(state => state.profits.allTime),
    runHours: sum(state => state.rates.runHours),
    balance: sum(state => state.balance)
  }
}
