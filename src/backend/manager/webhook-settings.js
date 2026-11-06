const { EVENTS, EVENT_IDS } = require('../events')
const { InputError } = require('./errors')
const { cleanText } = require('./validate')

const WEBHOOK_URL = /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/(?:v\d+\/)?webhooks\/\d+\/[\w-]+$/
const SNOWFLAKE = /^\d{5,25}$/
const HEX_COLOR = /^#[0-9a-f]{6}$/i
const MENTIONS = new Set(['none', 'everyone', 'here', 'role', 'user'])

function defaults () {
  return {
    name: 'Discord',
    url: '',
    enabled: true,
    events: EVENTS.filter(e => e.defaultOn).map(e => e.id),
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

function validateWebhook (input) {
  const base = defaults()
  const hook = { ...base, ...input, mention: { ...base.mention, ...input.mention } }

  const url = cleanText(hook.url, 'Webhook URL', { max: 300, required: true })
  if (!WEBHOOK_URL.test(url)) throw new InputError('Webhook URL must be a Discord webhook link (https://discord.com/api/webhooks/…).')

  if (!Array.isArray(hook.events) || hook.events.some(id => !EVENT_IDS.has(id))) throw new InputError('Unknown event.')
  if (hook.bots !== 'all' && (!Array.isArray(hook.bots) || hook.bots.some(id => typeof id !== 'string'))) throw new InputError('Bots must be "all" or a list.')

  const mention = hook.mention
  if (!MENTIONS.has(mention.type)) throw new InputError('Unknown mention.')
  if (!['alerts', 'all'].includes(mention.on)) throw new InputError('Unknown mention setting.')
  const mentionId = cleanText(mention.id, 'Mention ID', { max: 25 })
  if ((mention.type === 'role' || mention.type === 'user') && !SNOWFLAKE.test(mentionId)) {
    throw new InputError(`Paste the ${mention.type} ID (Discord: Developer Mode, then right-click → Copy ID).`)
  }

  const username = cleanText(hook.username, 'Display name', { max: 80 })
  if (/discord|clyde/i.test(username)) throw new InputError('Discord does not allow "discord" or "clyde" in the display name.')

  const avatarUrl = cleanText(hook.avatarUrl, 'Avatar URL', { max: 2048 })
  if (avatarUrl && !/^https?:\/\/\S+$/.test(avatarUrl)) throw new InputError('Avatar URL must start with https://.')

  if (hook.color !== 'level' && !HEX_COLOR.test(hook.color)) throw new InputError('Colour must be a hex colour like #2a78d6.')
  if (!['embed', 'text'].includes(hook.style)) throw new InputError('Unknown message style.')

  return {
    name: cleanText(hook.name, 'Name') || 'Discord',
    url,
    enabled: hook.enabled !== false,
    events: [...new Set(hook.events)],
    bots: hook.bots === 'all' ? 'all' : [...new Set(hook.bots)],
    mention: { type: mention.type, id: mentionId, on: mention.on },
    style: hook.style,
    username,
    avatarUrl,
    color: hook.color,
    showBotName: Boolean(hook.showBotName),
    includeFields: Boolean(hook.includeFields)
  }
}

module.exports = { validateWebhook }
