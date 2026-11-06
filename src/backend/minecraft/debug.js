const { strip } = require('../utils/text')
const { loreOf } = require('./inventory')

const TEXT_PACKETS = [
  'system_chat',
  'player_chat',
  'profileless_chat',
  'action_bar',
  'set_title_text',
  'set_title_subtitle'
]

const OUTGOING_PACKETS = ['chat_command', 'chat_command_signed', 'chat_message']

const INCOMING_INTERACTION_PACKETS = ['acknowledge_player_digging', 'open_window', 'window_items', 'close_window']
const ROUTINE_OUTGOING_PACKETS = ['tick_end', 'pong', 'keep_alive', 'position', 'flying', 'chunk_batch_received']

const SUMMARY_DELAY_MS = 10000

function packetJson (data) {
  return JSON.stringify(data, (key, value) => typeof value === 'bigint' ? String(value) : value).slice(0, 300)
}

function describePacket (name, data) {
  if (name === 'window_items') return `window ${data.windowId}, ${data.items.length} slots`
  return packetJson(data)
}

function logIncomingPackets (client) {
  client.on('packet', (data, { name }) => {
    if (TEXT_PACKETS.includes(name) || INCOMING_INTERACTION_PACKETS.includes(name)) {
      console.log(`[PACKET ${name}]`, describePacket(name, data))
    }
  })
}

function logOutgoingCommands (client) {
  const write = client.write.bind(client)

  client.write = (name, params) => {
    if (OUTGOING_PACKETS.includes(name)) {
      console.log(`[SENT ${name}]`, params.command ?? params.message)
    } else if (!ROUTINE_OUTGOING_PACKETS.includes(name)) {
      console.log(`[SENT ${name}]`, packetJson(params))
    }

    return write(name, params)
  }
}

function logPacketSummary (bot) {
  const counts = {}

  bot._client.on('packet', (data, { name }) => {
    counts[name] = (counts[name] || 0) + 1
  })

  bot.once('spawn', () => {
    setTimeout(() => {
      console.log('[PACKETS] Received in the first seconds after joining:', counts)
      console.log('[POSITION]', bot.entity?.position, 'dimension:', bot.game?.dimension)
      logScoreboards(bot)
    }, SUMMARY_DELAY_MS)
  })
}

function describe (value) {
  return typeof value === 'string' ? strip(value) : JSON.stringify(value)
}

function logScoreboards (bot) {
  const boards = Object.values(bot.scoreboards || {})

  if (boards.length === 0) console.log('[SCOREBOARD] none')

  for (const board of boards) {
    console.log(`[SCOREBOARD ${board.name}] title:`, describe(board.title), `(${board.items.length} lines)`)

    for (const item of board.items) {
      console.log(`[SCOREBOARD ${board.name}]`, describe(item.displayName.toString()), '=', item.value, `(entry: ${describe(item.name)})`)
    }
  }
}

function logSignEditors (bot, limit = 3) {
  let seen = 0

  bot.on('signOpen', block => {
    if (++seen > limit) return

    console.log(`[SIGN OPEN ${seen}/${limit}]`, block?.position, JSON.stringify(block?.blockEntity ?? null).slice(0, 600))
  })
}

function dumpWindow (window) {
  console.log('\n[WINDOW]', strip(JSON.stringify(window.title)))
  console.log(`inventoryStart: ${window.inventoryStart}`)

  window.slots.forEach((item, slot) => {
    if (!item) return

    const lore = slot < window.inventoryStart ? loreOf(item) : []

    console.log({
      slot,
      name: item.displayName,
      mcName: item.name,
      count: item.count,
      ...(lore.length && { lore })
    })
  })
}

function enableDebugLogging (bot) {
  bot.on('windowOpen', dumpWindow)
  logSignEditors(bot)
  logIncomingPackets(bot._client)
  logOutgoingCommands(bot._client)
  logPacketSummary(bot)
}

module.exports = { enableDebugLogging }
