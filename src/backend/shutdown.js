const { notify } = require('./notifier')
const { quitMinecraftBot } = require('./minecraft/connection')

let shuttingDown = false
let modules = []

async function shutdown () {
  if (shuttingDown) return
  shuttingDown = true

  console.log('[SYSTEM] Shutdown requested.')

  try {
    for (const module of modules) {
      try {
        await module.shutdown?.()
      } catch (err) {
        console.error(`[MODULE ${module.id}] Shutdown failed:`, err)
      }
    }

    await quitMinecraftBot()

    notify({ event: 'stopped', title: 'Bot stopped' })
  } catch (err) {
    console.error(err)
  }

  setTimeout(() => process.exit(0), 1000)
}

function registerShutdownHandler (activeModules = []) {
  modules = activeModules
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  process.on('unhandledRejection', err => console.error('[UNHANDLED]', err))
}

module.exports = { shutdown, registerShutdownHandler }
