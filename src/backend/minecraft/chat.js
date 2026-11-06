const { resolveComponent } = require('../evasion/lang')

const ON_SCREEN_PACKETS = new Set(['action_bar', 'set_title_text', 'set_title_subtitle'])

function listenToServer (bot) {
  const heard = new Set()
  const listen = text => { if (text) heard.add(text) }
  const listenOnScreen = (data, { name }) => {
    if (ON_SCREEN_PACKETS.has(name)) listen(resolveComponent(data.text))
  }

  bot.on('messagestr', listen)
  bot._client.on('packet', listenOnScreen)

  return {
    stop: () => {
      bot.removeListener('messagestr', listen)
      bot._client.removeListener('packet', listenOnScreen)
    },
    heard: pattern => [...heard].some(text => pattern.test(text)),
    explain: () => heard.size ? `server said: ${[...heard].join(' | ')}` : 'server said nothing'
  }
}

module.exports = { listenToServer }
