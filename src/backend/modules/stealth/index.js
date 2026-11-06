const { startStealthWatcher, stopStealthWatcher } = require('./watcher')

module.exports = {
  id: 'stealth',
  name: 'Stealth',
  description: 'Leaves the server when a player who is not whitelisted comes near.',
  kind: 'passive',
  enabledByDefault: false,

  create ({ shutdown }) {
    return {
      onSpawn () {
        startStealthWatcher(shutdown)
      },

      shutdown: stopStealthWatcher
    }
  }
}
