const config = require('./config')
const { notify } = require('./notifier')
const { sendToManager, onManagerMessage } = require('./ipc')
const { snapshot } = require('./state')
const { startMinecraftBot } = require('./minecraft/connection')
const { shutdown, registerShutdownHandler } = require('./shutdown')
const { createRuntimes, normalizeModuleIds, withOneActive } = require('./modules')

const STATE_EVERY_MS = 2000

const moduleIds = withOneActive(normalizeModuleIds(config.modules))
const modules = createRuntimes(moduleIds, { shutdown })
const moduleCommands = Object.create(null)
for (const module of modules) {
  for (const [name, command] of Object.entries(module.commands ?? {})) {
    if (Object.hasOwn(moduleCommands, name)) {
      throw new Error(`Module command "${name}" is registered more than once.`)
    }
    moduleCommands[name] = command
  }
}

let lastState = null

function pushState () {
  try {
    const state = {
      ...snapshot(),
      modules: Object.fromEntries(modules.filter(module => module.snapshot).map(module => [module.id, module.snapshot()]))
    }
    const json = JSON.stringify(state)
    if (json === lastState) return

    lastState = json
    sendToManager('state', { state })
  } catch (err) {
    console.error('[STATE]', err)
  }
}

async function runCommand (name) {
  const command = moduleCommands[name]

  try {
    if (!command) throw new Error(`Unknown command: ${name}`)

    const running = command(notify)
    pushState()
    await running
  } catch (err) {
    console.error(err)
    notify({ event: 'command-failed', title: 'Command failed', description: err.message, level: 'error' })
  } finally {
    pushState()
  }
}

async function dispatchModules (hook, ...args) {
  for (const module of modules) {
    try {
      await module[hook]?.(...args)
    } catch (err) {
      console.error(`[MODULE ${module.id}] ${hook} failed:`, err)
    }
  }
}

registerShutdownHandler(modules)

onManagerMessage(message => {
  if (message.type === 'command') runCommand(message.name)
  if (message.type === 'shutdown') shutdown()
})

process.on('disconnect', shutdown)

setInterval(pushState, STATE_EVERY_MS)

startMinecraftBot({
  async onSpawn (bot) {
    await dispatchModules('onSpawn', bot)

    pushState()
  },

  async onKicked (reason) {
    notify({
      event: 'kicked',
      title: 'Kicked',
      description: `The server kicked the bot: ${reason}. It has stopped and will not rejoin until it is started again.`,
      level: 'alert'
    })
    await shutdown()
  },

  async onChat (msg) {
    await dispatchModules('onChat', msg)
  }
})

for (const module of modules) module.start?.()
pushState()
