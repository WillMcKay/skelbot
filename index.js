const { BotManager } = require('./src/backend/manager/bots')
const { Webhooks } = require('./src/backend/manager/webhooks')
const { startServer } = require('./src/backend/manager/server')
const { SignIns } = require('./src/backend/manager/signin')
const { Proxies } = require('./src/backend/manager/proxies')

const proxies = new Proxies()
const manager = new BotManager({ proxies })
const webhooks = new Webhooks()

manager.on('notification', ({ id, name, notification }) => webhooks.deliver({ id, name }, notification))

const server = startServer({ manager, webhooks, proxies, signIns: new SignIns(manager) })
manager.startAll()

let stopping = false

async function stopEverything () {
  if (stopping) return
  stopping = true

  console.log('[MANAGER] Stopping all bots...')
  server.close()
  await manager.stopAll()
  process.exit(0)
}

process.on('SIGINT', stopEverything)
process.on('SIGTERM', stopEverything)
process.on('unhandledRejection', err => console.error('[UNHANDLED]', err))
