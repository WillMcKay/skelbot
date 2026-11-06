const TYPES = { socks5: 'socks5', socks: 'socks5', socks4: 'socks4', http: 'http' }
const DEFAULT_TYPE = 'socks5'

function parseProxy (line) {
  const text = line.trim()
  const url = new URL(/^[a-z0-9]+:\/\//i.test(text) ? text : fromBare(text))
  const type = TYPES[url.protocol.slice(0, -1).toLowerCase()]
  const port = Number(url.port)

  if (!type) throw new Error(`Unknown type "${url.protocol.slice(0, -1)}"; use socks5, socks4 or http.`)
  if (!url.hostname || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Needs a host and a port.')

  return {
    type,
    host: url.hostname,
    port,
    username: decodeURIComponent(url.username) || null,
    password: decodeURIComponent(url.password) || null
  }
}

function fromBare (text) {
  const [host, port, username, password, ...rest] = text.split(':')
  if (rest.length || (username && password === undefined)) throw new Error('Use host:port or host:port:user:pass.')
  const auth = username ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : ''
  return `${DEFAULT_TYPE}://${auth}${host}:${port}`
}

function parseProxyList (lines) {
  return lines
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      try {
        return { line, proxy: parseProxy(line) }
      } catch (err) {
        return { line, error: err instanceof TypeError ? 'Not a proxy address.' : err.message }
      }
    })
}

module.exports = { parseProxyList }
