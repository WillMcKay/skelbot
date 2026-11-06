const { EVENTS } = require('../events')
const { moduleCatalog } = require('../modules')
const { versionCatalog } = require('./server-settings')
const { buildCommit } = require('./build-commit')

const HEARTBEAT_MS = 25000
const COMMIT = buildCommit()

function startEvents ({ manager, webhooks, proxies }, req, res) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-store',
    connection: 'keep-alive'
  })

  const emit = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

  emit('snapshot', {
    bots: manager.list({ full: true }),
    webhooks: webhooks.list(),
    proxies: proxies.view(),
    modules: moduleCatalog(),
    versions: versionCatalog(),
    commit: COMMIT,
    events: EVENTS
  })

  const subscriptions = [
    [manager, 'bot', bot => emit('bot', bot)],
    [manager, 'uptime', event => emit('uptime', event)],
    [manager, 'removed', id => emit('removed', { id })],
    [manager, 'log', entry => emit('log', entry)],
    [manager, 'logs-cleared', id => emit('logs-cleared', { id })],
    [manager, 'notification', ({ id, notification }) => emit('notification', { id, notification })],
    [webhooks, 'changed', list => emit('webhooks', { webhooks: list })],
    [proxies, 'changed', view => emit('proxies', view)]
  ]

  for (const [source, event, listener] of subscriptions) source.on(event, listener)
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS)

  req.on('close', () => {
    clearInterval(heartbeat)
    for (const [source, event, listener] of subscriptions) source.off(event, listener)
  })
}

module.exports = { startEvents }
