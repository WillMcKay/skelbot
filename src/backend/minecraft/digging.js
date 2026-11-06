const { describeTool, digProgress } = require('./tools')
const { waitUntil } = require('./movement')
const { digBlockVanilla } = require('../evasion/interact')

const BREAK_CONFIRM_MS = 500
const MAX_HOLD_MS = 60000

async function breakBlock (bot, block) {
  const gone = () => bot.blockAt(block.position)?.name !== block.name
  const until = Date.now() + MAX_HOLD_MS

  while (!gone()) {
    if (Date.now() > until) {
      throw new Error(`${block.name} at ${block.position} was still there after holding break for ${MAX_HOLD_MS / 1000}s with ${describeTool(bot, bot.heldItem)}.`)
    }

    await digBlockVanilla(bot, block, () => digProgress(bot, block), until)
    await waitUntil(bot, gone, BREAK_CONFIRM_MS)
  }
}

module.exports = { breakBlock }
