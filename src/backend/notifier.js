const { sendToManager } = require('./ipc')

function describe ({ title, description, fields = {} }) {
  const details = Object.entries(fields).map(([label, value]) => `${label}: ${value}`)
  return [title, description, ...details].filter(Boolean).join(' | ')
}

function notify (notification) {
  const level = notification.level ?? 'info'
  console.log(`[NOTIFY ${level.toUpperCase()}]`, describe(notification))
  sendToManager('notify', { notification: { ...notification, level, at: Date.now() } })
}

module.exports = { notify }
