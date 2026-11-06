const path = require('path')

const isBotProcess = Boolean(process.env.SKELBOT_BOT_ID)
require('dotenv').config({ override: !isBotProcess, quiet: true })

function required (name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set. Add it to .env.`)
  return value
}

function number (name, fallback, min = 0) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback

  const value = Number(raw)
  if (!Number.isFinite(value) || value < min) throw new Error(`${name} must be a number of at least ${min}, got "${raw}".`)

  return value
}

function parseJson (name, fallback) {
  try {
    return process.env[name] ? JSON.parse(process.env[name]) : fallback
  } catch {
    throw new Error(`${name} is not valid JSON.`)
  }
}

function parseList (value) {
  return (value || '')
    .split(',')
    .map(x => x.trim().toLowerCase())
    .filter(Boolean)
}

const ROOT = path.join(__dirname, '..', '..')

module.exports = {
  root: ROOT,
  dataDir: process.env.SKELBOT_DATA_DIR || path.join(ROOT, 'data'),
  mc: {
    host: process.env.MC_HOST || 'donutsmp.net',
    port: number('MC_PORT', 25565, 1),
    get username () { return required('MC_USERNAME') },
    version: process.env.MC_VERSION || '1.21.11'
  },
  ui: {
    host: process.env.UI_HOST || '127.0.0.1',
    port: number('UI_PORT', 3000, 1),
    allowedHosts: parseList(process.env.UI_ALLOWED_HOSTS)
  },
  cycle: {
    everyMs: number('CYCLE_MS', 300000, 1000)
  },
  orders: {
    bone: {
      command: '/order bones',
      item: 'bone',
      label: 'Bone'
    },
    arrow: {
      command: '/order arrows',
      item: 'arrow',
      label: 'Arrow'
    }
  },
  network: {
    proxies: parseJson('SKELBOT_PROXIES', []),
    requireProxy: process.env.SKELBOT_REQUIRE_PROXY === 'true'
  },
  modules: parseJson('SKELBOT_MODULES', ['spawners']),
  economy: {
    payoutTo: process.env.PAYOUT_TO || null,
    payoutMinBalance: number('PAYOUT_MIN_BALANCE', 0),
    payoutKeep: number('PAYOUT_KEEP', 0)
  },
  debug: {
    logChat: process.env.LOG_CHAT === 'true'
  },
  stealth: parseJson('SKELBOT_STEALTH', { radius: 20, whitelist: ['MineProbe'] })
}
