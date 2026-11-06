export function matchRoute (path) {
  const [section, id, sub] = path.split('/').filter(Boolean)

  if (section === 'bots' && id === 'new') return { page: 'overview', dialog: 'new-bot' }
  if (section === 'bots' && id) return { page: 'bot', id, dialog: sub === 'edit' ? 'edit-bot' : null }
  if (section === 'webhooks') return id ? { page: 'webhook', id } : { page: 'webhooks' }
  if (section === 'proxies') return { page: 'proxies' }
  return { page: 'overview' }
}
