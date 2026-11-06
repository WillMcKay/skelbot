const { sleep } = require('../utils/sleep')

const MAX_RETRIES = 2
const LEVEL_COLORS = { info: 0x2a78d6, warning: 0xfab219, error: 0xd03b3b, alert: 0xed4245 }

function mentionOf (hook, notification) {
  const { type, id, on } = hook.mention
  if (type === 'none' || (on === 'alerts' && notification.level !== 'alert')) return null

  switch (type) {
    case 'everyone': return { content: '@everyone', allowed: { parse: ['everyone'] } }
    case 'here': return { content: '@here', allowed: { parse: ['everyone'] } }
    case 'role': return { content: `<@&${id}>`, allowed: { parse: [], roles: [id] } }
    case 'user': return { content: `<@${id}>`, allowed: { parse: [], users: [id] } }
  }
}

function buildMessage (hook, botName, notification) {
  const title = hook.showBotName ? `${botName}: ${notification.title}` : notification.title
  const fields = hook.includeFields ? Object.entries(notification.fields ?? {}) : []
  const mention = mentionOf(hook, notification)

  const message = {
    username: hook.username || undefined,
    avatar_url: hook.avatarUrl || undefined,
    allowed_mentions: mention?.allowed ?? { parse: [] }
  }

  if (hook.style === 'text') {
    const lines = [
      mention?.content,
      `**${title}**`,
      notification.description,
      fields.length ? fields.map(([name, value]) => `${name}: **${value}**`).join(' · ') : null
    ]
    return { ...message, content: lines.filter(Boolean).join('\n').slice(0, 2000) }
  }

  return {
    ...message,
    content: mention?.content,
    embeds: [{
      title: title.slice(0, 256),
      description: notification.description?.slice(0, 4096),
      color: hook.color === 'level' ? LEVEL_COLORS[notification.level] ?? LEVEL_COLORS.info : parseInt(hook.color.slice(1), 16),
      fields: fields.slice(0, 25).map(([name, value]) => ({ name: String(name).slice(0, 256), value: String(value).slice(0, 1024), inline: true })),
      timestamp: new Date(notification.at ?? Date.now()).toISOString()
    }]
  }
}

async function post (url, message) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(message) })
    if (res.ok) return

    const body = await res.json().catch(() => ({}))

    if (res.status === 429 && attempt < MAX_RETRIES) {
      await sleep(Math.ceil((body.retry_after ?? 1) * 1000))
      continue
    }

    const reason = body.message ?? res.statusText
    throw new Error(res.status === 404 ? 'Discord says this webhook no longer exists. Copy a new URL.' : `Discord returned ${res.status}: ${reason}`)
  }
}

module.exports = { buildMessage, post }
