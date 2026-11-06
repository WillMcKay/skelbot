const config = require('../config')
const { runBoneCycle, stopBoneCycle } = require('./cycle')

let timer = null

function isAutoBonesEnabled () {
  return timer !== null
}

function enableAutoBones () {
  disableAutoBones()
  timer = setInterval(runBoneCycle, config.cycle.everyMs)
}

function disableAutoBones () {
  clearInterval(timer)
  timer = null
}

async function startAutoBones () {
  enableAutoBones()
  await runBoneCycle()
}

async function stopAutomation () {
  disableAutoBones()
  await stopBoneCycle()
}

module.exports = { isAutoBonesEnabled, startAutoBones, stopAutomation }
