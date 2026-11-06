const { notify } = require('../notifier')
const { getBot } = require('../minecraft/connection')
const { closeAllWindows } = require('../minecraft/windows')
const { pickUpSpawners } = require('../minecraft/spawner')
const { stopAutomation } = require('./autoBones')

async function packUpSpawners () {
  await stopAutomation()

  const bot = getBot()
  if (!bot?.entity) return

  try {
    await closeAllWindows(bot)

    const picked = await pickUpSpawners(bot)
    if (picked) notify({ event: 'spawners-picked-up', title: 'Spawners picked up', description: `Took ${picked} spawner(s) before leaving.` })
  } catch (err) {
    notify({ event: 'pickup-failed', title: 'Could not pick up spawners', description: err.message, level: 'error' })
  }
}

module.exports = { packUpSpawners }
