const { sleep } = require('../utils/sleep')

function windowTitleText (window) {
  return JSON.stringify(window?.title || '').toLowerCase()
}

function windowTitleIncludes (window, text) {
  return windowTitleText(window).includes(text)
}

function closeCurrentWindow (bot) {
  if (!bot.currentWindow) return false

  try {
    bot.closeWindow(bot.currentWindow)
  } catch {}

  return true
}

async function closeAllWindows (bot) {
  if (!bot) return

  for (let i = 0; i < 5; i++) {
    if (!closeCurrentWindow(bot)) break
    await sleep(300)
  }
}

async function closeWindowTwice (bot) {
  if (!bot) return

  for (let i = 0; i < 2; i++) {
    closeCurrentWindow(bot)
    await sleep(500)
  }
}

function waitForNextWindow (bot, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      bot.removeListener('windowOpen', onWindow)
      reject(new Error('Timed out waiting for next window'))
    }, timeoutMs)

    function onWindow (window) {
      clearTimeout(timeout)
      bot.removeListener('windowOpen', onWindow)
      resolve(window)
    }

    bot.on('windowOpen', onWindow)
  })
}

module.exports = {
  windowTitleText,
  windowTitleIncludes,
  closeAllWindows,
  closeWindowTwice,
  waitForNextWindow
}
