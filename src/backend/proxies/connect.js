const dns = require('dns').promises
const http = require('http')
const net = require('net')
const { SocksClient } = require('socks')

const TIMEOUT_MS = 10000

function viaSocks (proxy, destination) {
  return SocksClient.createConnection({
    proxy: { host: proxy.host, port: proxy.port, type: proxy.type === 'socks4' ? 4 : 5, userId: proxy.username ?? undefined, password: proxy.password ?? undefined },
    command: 'connect',
    destination,
    timeout: TIMEOUT_MS
  }).then(info => info.socket)
}

function viaHttp (proxy, destination) {
  return new Promise((resolve, reject) => {
    const auth = proxy.username ? { 'proxy-authorization': `Basic ${Buffer.from(`${proxy.username}:${proxy.password ?? ''}`).toString('base64')}` } : {}
    const target = `${destination.host}:${destination.port}`
    const req = http.request({ host: proxy.host, port: proxy.port, method: 'CONNECT', path: target, headers: { host: target, ...auth }, timeout: TIMEOUT_MS })

    req.once('connect', (res, socket) => {
      if (res.statusCode === 200) return resolve(socket)
      socket.destroy()
      reject(new Error(`proxy answered ${res.statusCode}`))
    })
    req.once('timeout', () => req.destroy(new Error('timed out')))
    req.once('error', reject)
    req.end()
  })
}

function openThrough (proxy, destination) {
  return proxy.type === 'http' ? viaHttp(proxy, destination) : viaSocks(proxy, destination)
}

function shuffled (list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

async function connectThroughAny (proxies, destination, onFail = () => {}) {
  for (const proxy of shuffled(proxies)) {
    try {
      return { proxy, socket: await openThrough(proxy, destination) }
    } catch (err) {
      onFail(proxy, err)
    }
  }
  return null
}

function describeProxy (proxy) {
  return `${proxy.type} ${proxy.host}:${proxy.port}`
}

async function minecraftAddress (host, port) {
  if (port !== 25565 || net.isIP(host) || host === 'localhost') return { host, port }
  try {
    const [record] = await dns.resolveSrv(`_minecraft._tcp.${host}`)
    return record ? { host: record.name, port: record.port } : { host, port }
  } catch {
    return { host, port }
  }
}

async function routeToServer ({ proxies, requireProxy, host, port }) {
  if (proxies.length === 0) {
    return requireProxy ? { blocked: 'A proxy is required, but none are set.' } : { direct: true }
  }

  const destination = await minecraftAddress(host, port)
  const found = await connectThroughAny(proxies, destination, (proxy, err) => {
    console.log(`[PROXY] ${describeProxy(proxy)} failed: ${err.message}`)
  })

  if (found) {
    console.log(`[PROXY] Connected through ${describeProxy(found.proxy)}.`)
    return { socket: found.socket }
  }

  const tried = `None of the ${proxies.length} ${proxies.length === 1 ? 'proxy' : 'proxies'} worked`
  if (requireProxy) return { blocked: `${tried}, and a proxy is required.` }

  console.log(`[PROXY] ${tried}; connecting directly.`)
  return { direct: true }
}

module.exports = { routeToServer }
