const MASK = '•••'

export const BLURRED_TEXT = 'select-none blur-[4px]'
export const MASKED_TEXT = '[-webkit-text-security:disc]'

const COORDINATES = /-?\d+, ?-?\d+, ?-?\d+/g

const GENERIC_DESCRIPTIONS = {
  'player-nearby': 'A player came within range. Packing up the spawners and disconnecting.',
  teleported: 'The bot was moved somewhere else. Farming stopped.',
  died: 'The bot died. Farming stopped.'
}

function fakePlace (seed, dimension = 'overworld') {
  let hash = 2166136261
  for (const char of String(seed)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  const next = (range, offset) => {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822507)
    return ((hash >>> 0) % range) + offset
  }
  return { x: next(600000, -300000), y: next(120, -60), z: next(600000, -300000), dimension }
}

const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function anonymizer (bots) {
  const aliases = new Map(bots.map((bot, index) => [bot.id, `Bot ${index + 1}`]))
  const replacements = new Map()

  for (const bot of bots) {
    const alias = aliases.get(bot.id)
    for (const secret of [bot.name, bot.account, bot.account?.split('@')[0], bot.state?.username]) {
      if (secret) replacements.set(secret.toLowerCase(), alias)
    }
    if (bot.payoutTo) replacements.set(bot.payoutTo.toLowerCase(), MASK)
  }

  const secrets = [...replacements.keys()].sort((a, b) => b.length - a.length).map(escape)
  const pattern = secrets.length ? new RegExp(`(?<![\\w@.])(${secrets.join('|')})(?![\\w@])`, 'gi') : null

  const redact = text => {
    if (typeof text !== 'string') return text
    const named = pattern ? text.replace(pattern, match => replacements.get(match.toLowerCase())) : text
    return named.replace(COORDINATES, MASK)
  }

  return { aliasOf: id => aliases.get(id) ?? 'Bot', redact }
}

export function anonymizeNotification (notification, redact) {
  return {
    ...notification,
    title: redact(notification.title),
    description: GENERIC_DESCRIPTIONS[notification.event] ?? redact(notification.description),
    fields: notification.fields && Object.fromEntries(
      Object.entries(notification.fields).map(([label, value]) => [redact(label), redact(value)])
    )
  }
}

export function anonymizeBots (bots) {
  const { aliasOf, redact } = anonymizer(bots)

  const list = bots.map(bot => {
    const alias = aliasOf(bot.id)
    return {
      ...bot,
      name: alias,
      payoutTo: bot.payoutTo ? MASK : '',
      state: bot.state && { ...bot.state, username: bot.state.username ? alias : null, place: bot.state.place && fakePlace(bot.id, bot.state.place.dimension) },
      logs: bot.logs?.map(entry => ({ ...entry, line: redact(entry.line) })),
      notifications: bot.notifications?.map(n => anonymizeNotification(n, redact))
    }
  })

  return { list, redact }
}
