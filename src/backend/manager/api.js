const { InputError } = require('./errors')
const { startEvents } = require('./event-stream')
const { send, readBody } = require('./http-utils')

const logFailure = err => console.error('[MANAGER]', err)
const notAllowed = res => send(res, 405, { error: 'Not allowed.' })

const BOT_ACTIONS = {
  start: ({ manager }, id) => manager.start(id),
  stop: ({ manager }, id) => { manager.stop(id).catch(logFailure) },
  restart: ({ manager }, id) => { manager.restart(id).catch(logFailure) },
  async command ({ manager }, id, req) {
    const { name } = await readBody(req)
    manager.command(id, name)
  }
}

function usingSignIn (signIns, signIn, apply) {
  const bot = apply(signIn ? signIns.login(signIn) : null)
  if (signIn) signIns.forget(signIn)
  return bot
}

async function handleBots (services, req, res, id, action) {
  const { manager, signIns } = services
  const { method } = req

  if (!id) {
    if (method === 'GET') return send(res, 200, { bots: manager.list() })
    if (method === 'POST') {
      const { signIn, start, ...settings } = await readBody(req)
      return send(res, 201, usingSignIn(signIns, signIn, login => manager.create({ ...settings, login, start })))
    }
  } else if (!action) {
    if (method === 'PATCH') {
      const { signIn, ...settings } = await readBody(req)
      return send(res, 200, usingSignIn(signIns, signIn, login => manager.update(id, { ...settings, login })))
    }
    if (method === 'DELETE') {
      manager.remove(id)
      return send(res, 200, { ok: true })
    }
  } else if (method === 'POST' && Object.hasOwn(BOT_ACTIONS, action)) {
    await BOT_ACTIONS[action](services, id, req)
    return send(res, 202, { ok: true })
  }

  notAllowed(res)
}

async function handleWebhooks ({ webhooks }, req, res, id) {
  const { method } = req

  if (!id) {
    if (method === 'GET') return send(res, 200, { webhooks: webhooks.list() })
    if (method === 'POST') return send(res, 201, webhooks.create(await readBody(req)))
  } else if (id === 'test' && method === 'POST') {
    try {
      await webhooks.test(await readBody(req))
      return send(res, 200, { ok: true })
    } catch (err) {
      if (err instanceof InputError) throw err
      return send(res, 502, { error: err.message })
    }
  } else {
    if (method === 'PATCH') return send(res, 200, webhooks.update(id, await readBody(req)))
    if (method === 'DELETE') {
      webhooks.remove(id)
      return send(res, 200, { ok: true })
    }
  }

  notAllowed(res)
}

async function handleProxies ({ proxies }, req, res) {
  if (req.method === 'GET') return send(res, 200, proxies.view())
  if (req.method === 'PUT') return send(res, 200, proxies.update(await readBody(req)))
  notAllowed(res)
}

function handleSignIn ({ signIns }, req, res, id) {
  if (req.method === 'POST' && !id) return send(res, 202, signIns.start())

  if (req.method === 'GET' && id) {
    const state = signIns.get(id)
    return state ? send(res, 200, state) : send(res, 404, { error: 'That sign-in expired. Start again.' })
  }

  notAllowed(res)
}

const ROUTES = { bots: handleBots, webhooks: handleWebhooks, proxies: handleProxies, signin: handleSignIn }

function handleApi (services, req, res, [, section, id, action]) {
  if (section === 'events' && req.method === 'GET') return startEvents(services, req, res)
  if (!Object.hasOwn(ROUTES, section)) return send(res, 404, { error: 'Not found.' })
  return ROUTES[section](services, req, res, id, action)
}

module.exports = { handleApi }
