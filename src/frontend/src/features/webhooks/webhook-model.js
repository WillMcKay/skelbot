export const MENTIONS = {
  none: 'No mention',
  everyone: '@everyone',
  here: '@here',
  role: 'A role',
  user: 'A user'
}

export const needsMentionId = type => type === 'role' || type === 'user'

export const LEVEL_COLORS = { info: '#2a78d6', warning: '#fab219', error: '#d03b3b', alert: '#ed4245' }

export const SAMPLES = {
  alert: {
    label: 'Alert',
    level: 'alert',
    title: 'Bot teleported',
    description: 'Moved from 120, 64, -340 (overworld) to 0, 80, 0 (overworld). Farming stopped; restart the bot once it is back at the spawners.',
    fields: {}
  },
  report: {
    label: 'Daily report',
    level: 'info',
    title: 'Daily report',
    description: 'Today $48.2k · $2.0k per hour · All time $1.21m · Balance $12.4k · Running 3d',
    fields: {}
  },
  cycle: {
    label: 'Cycle finished',
    level: 'info',
    title: 'Cycle finished',
    fields: { 'Bones taken': 1728, 'Bones sold': 1728, 'Bones left': 0, 'Arrows taken': 640, 'Arrows sold': 640, 'Arrows left': 0 }
  }
}

export function newWebhook (events) {
  return {
    name: 'Discord',
    url: '',
    enabled: true,
    events: events.filter(e => e.defaultOn).map(e => e.id),
    bots: 'all',
    mention: { type: 'everyone', id: '', on: 'alerts' },
    style: 'embed',
    username: 'skelbot',
    avatarUrl: '',
    color: 'level',
    showBotName: true,
    includeFields: true
  }
}

export function settingsOf ({ id: _id, lastResult: _lastResult, ...settings }) {
  return settings
}

export function describe (hook, eventCount, bots) {
  const botText = hook.bots === 'all'
    ? 'all bots'
    : `${hook.bots.filter(id => bots.some(b => b.id === id)).length} of ${bots.length} bots`

  const { type, on } = hook.mention
  const who = needsMentionId(type) ? `a ${type}` : MENTIONS[type]
  const mention = type === 'none' ? 'no mentions' : `${who} on ${on === 'alerts' ? 'alerts' : 'every message'}`

  return `${hook.events.length} of ${eventCount} events · ${botText} · ${mention}`
}

export function previewOf (hook, sample) {
  const showMention = hook.mention.type !== 'none' && (hook.mention.on === 'all' || sample.level === 'alert')

  return {
    name: hook.username || hook.name || 'Webhook',
    avatarUrl: hook.avatarUrl,
    mention: showMention ? { everyone: '@everyone', here: '@here', role: '@role', user: '@user' }[hook.mention.type] : null,
    title: hook.showBotName ? `Alt 1: ${sample.title}` : sample.title,
    description: sample.description,
    fields: hook.includeFields ? Object.entries(sample.fields) : [],
    color: hook.color === 'level' ? LEVEL_COLORS[sample.level] : hook.color,
    asEmbed: hook.style === 'embed'
  }
}
