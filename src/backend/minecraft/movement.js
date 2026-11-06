const { sleep } = require('../utils/sleep')

const CROUCH_SETTLE_MS = 1000
const STAND_TICKS = 2
const CENTER_TOLERANCE = 0.1
const CENTER_TIMEOUT_MS = 3000

async function waitUntil (bot, check, timeoutMs) {
  const end = Date.now() + timeoutMs

  while (Date.now() < end) {
    if (check()) return true
    await bot.waitForTicks(1)
  }

  return check()
}

async function whileCrouched (bot, fn) {
  bot.setControlState('sneak', true)

  try {
    await sleep(CROUCH_SETTLE_MS)
    return await fn()
  } finally {
    bot.setControlState('sneak', false)
    await bot.waitForTicks(STAND_TICKS)
  }
}

async function moveToBlockCenter (bot) {
  const target = bot.entity.position.floored().offset(0.5, 0, 0.5)
  const { yaw, pitch } = bot.entity
  const end = Date.now() + CENTER_TIMEOUT_MS
  const offCenter = () => Math.hypot(target.x - bot.entity.position.x, target.z - bot.entity.position.z)

  if (offCenter() <= CENTER_TOLERANCE) return true

  bot.setControlState('sneak', true)

  try {
    while (offCenter() > CENTER_TOLERANCE && Date.now() < end) {
      await bot.lookAt(target.offset(0, bot.entity.eyeHeight, 0))
      bot.setControlState('forward', true)
      await bot.waitForTicks(1)
    }

    return offCenter() <= CENTER_TOLERANCE
  } finally {
    bot.clearControlStates()
    await bot.look(yaw, pitch)
  }
}

module.exports = { waitUntil, whileCrouched, moveToBlockCenter }
