function sendToManager (type, payload = {}) {
  if (!process.send || !process.connected) return

  try {
    process.send({ type, ...payload })
  } catch (err) {
    console.error('[IPC]', err.message)
  }
}

function onManagerMessage (handler) {
  process.on('message', message => {
    if (message && typeof message === 'object') handler(message)
  })
}

module.exports = { sendToManager, onManagerMessage }
