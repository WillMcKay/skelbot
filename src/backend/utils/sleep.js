const { setTimeout: wait } = require('timers/promises')

function sleep (ms, signal) {
  return wait(ms, undefined, { signal })
}

module.exports = { sleep }
