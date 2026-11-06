const EVENTS = [
  { id: 'player-nearby', group: 'Alerts', label: 'Player nearby', level: 'alert', defaultOn: true, description: 'A player not on the whitelist came close, so the bot left the server.' },
  { id: 'teleported', group: 'Alerts', label: 'Teleported', level: 'alert', defaultOn: true, description: 'The server moved the bot; farming stops.' },
  { id: 'died', group: 'Alerts', label: 'Died', level: 'alert', defaultOn: true, description: 'The bot died and respawned; farming stops.' },
  { id: 'kicked', group: 'Alerts', label: 'Kicked', level: 'alert', defaultOn: true, description: 'The server kicked the bot; it stays offline.' },

  { id: 'disconnected', group: 'Connection', label: 'Disconnected', level: 'warning', defaultOn: true, description: 'Lost connection; it keeps trying to reconnect.' },
  { id: 'crashed', group: 'Connection', label: 'Bot crashed', level: 'error', defaultOn: true, description: 'The bot process crashed and is restarting.' },
  { id: 'connected', group: 'Connection', label: 'Connected', level: 'info', defaultOn: false, description: 'Joined the server, with balance and profit so far.' },
  { id: 'stopped', group: 'Connection', label: 'Bot stopped', level: 'info', defaultOn: false, description: 'The bot left the server.' },

  { id: 'cycle-failed', group: 'Farming', label: 'Cycle failed', level: 'error', defaultOn: true, description: 'A collect-and-deliver cycle hit an error (once per new error).' },
  { id: 'spawner-stuck', group: 'Alerts', label: 'Spawner stuck', level: 'alert', defaultOn: true, description: 'The spawner would not open even after rejoining.' },
  { id: 'pickup-failed', group: 'Farming', label: 'Could not pick up spawners', level: 'error', defaultOn: true, description: 'Leaving without the spawners.' },
  { id: 'cycle-finished', group: 'Farming', label: 'Cycle finished', level: 'info', defaultOn: false, description: 'Items taken, sold and left, after a cycle you started from the UI.' },
  { id: 'spawners-picked-up', group: 'Farming', label: 'Spawners picked up', level: 'info', defaultOn: false, description: 'Spawners mined before leaving.' },
  { id: 'command-failed', group: 'Farming', label: 'Command failed', level: 'error', defaultOn: false, description: 'A button in the UI failed.' },

  { id: 'daily-report', group: 'Reports', label: 'Daily report', level: 'info', defaultOn: true, description: 'Profit today, per hour, all time and balance, once a day.' }
]

const EVENT_IDS = new Set(EVENTS.map(e => e.id))

module.exports = { EVENTS, EVENT_IDS }
