const http = require('http')
const config = require('../config')
const { handleApi } = require('./api')
const { InputError } = require('./errors')
const { send } = require('./http-utils')
const { serveStatic } = require('./static-files')

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

function hostnameOf (value) {
  try {
    return new URL(value.includes('://') ? value : `http://${value}`).hostname
  } catch {
    return null
  }
}

function isAllowedHost (value) {
  const hostname = hostnameOf(value ?? '')?.toLowerCase()
  return hostname !== undefined && (LOOPBACK.has(hostname) || config.ui.allowedHosts.includes(hostname))
}

function isAllowedRequest (req) {
  if (!isAllowedHost(req.headers.host)) return false
  const origin = req.headers.origin
  return !origin || isAllowedHost(origin)
}

async function route (services, req, res) {
  if (!isAllowedRequest(req)) return send(res, 403, { error: 'Open the UI from localhost or a configured allowed host.' })

  const parts = new URL(req.url, 'http://localhost').pathname.split('/').filter(Boolean)

  if (parts[0] === 'api') {
    if (req.method !== 'GET' && req.headers['x-skelbot'] !== '1') return send(res, 403, { error: 'Missing X-Skelbot header.' })
    return handleApi(services, req, res, parts)
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Not allowed.' })
  serveStatic(req, res)
}

function startServer (services) {
  const server = http.createServer(async (req, res) => {
    try {
      await route(services, req, res)
    } catch (err) {
      if (err instanceof InputError) return send(res, 400, { error: err.message })

      console.error('[HTTP]', err)
      if (!res.headersSent) send(res, 500, { error: 'Something went wrong.' })
    }
  })

  server.listen(config.ui.port, config.ui.host, () => {
    const shown = config.ui.host === '0.0.0.0' ? 'localhost' : config.ui.host
    console.log(`[UI] Open http://${shown}:${config.ui.port}`)
  })

  return server
}

module.exports = { startServer }
