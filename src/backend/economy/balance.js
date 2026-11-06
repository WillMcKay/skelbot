const { getBot } = require('../minecraft/connection')
const { sleep } = require('../utils/sleep')
const { AMOUNT, parseNumberWithSuffix } = require('../utils/text')

const BALANCE_PATTERNS = [
  new RegExp(`You have ${AMOUNT}`, 'i'),
  new RegExp(`(?:balance|money):\\s*${AMOUNT}`, 'i')
]

const REPLY_WINDOW_MS = 5000

let balance = 0
let awaitingReplyUntil = 0

function getBalance () {
  return balance
}

async function updateBalance () {
  const bot = getBot()
  if (!bot) return balance

  awaitingReplyUntil = Date.now() + REPLY_WINDOW_MS
  console.log('[BALANCE] Sent /balance')
  bot.chat('/balance')
  await sleep(1200)

  return balance
}

function parseBalance (msg) {
  if (Date.now() > awaitingReplyUntil) return

  const match = BALANCE_PATTERNS
    .map(pattern => msg.match(pattern))
    .find(Boolean)

  if (!match) {
    console.log('[BALANCE] Ignored message while waiting for /balance reply:', msg)
    return
  }

  awaitingReplyUntil = 0
  balance = parseNumberWithSuffix(match[1], match[2])
  console.log('[BALANCE]', balance)
}

module.exports = { getBalance, updateBalance, parseBalance }
