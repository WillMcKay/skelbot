const { InputError } = require('./errors')

const RECOMMENDED_VERSION = '1.21.11'
const SUPPORTED_VERSIONS = ['26.1', '1.21.11', '1.21.9', '1.21.8', '1.21.6', '1.21.5', '1.21.4']
const REQUIRED_PACKETS = ['chat_session_update', 'player_loaded', 'tick_end']

const DEFAULT_SERVER = { serverHost: 'donutsmp.net', serverPort: 25565, serverVersion: RECOMMENDED_VERSION }
const HOST = /^(?=.{1,253}$)[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*$/

function validServerHost (value) {
  const host = typeof value === 'string' ? value.trim() : ''
  if (!HOST.test(host)) throw new InputError('Enter a server address like donutsmp.net.')
  return host
}

function validServerPort (value) {
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new InputError('Port must be between 1 and 65535.')
  return port
}

function validServerVersion (value) {
  const version = typeof value === 'string' ? value.trim() : ''
  if (!SUPPORTED_VERSIONS.includes(version)) throw new InputError(`Choose a supported Minecraft version, like ${RECOMMENDED_VERSION}.`)
  return version
}

function defaultServer () {
  return { ...DEFAULT_SERVER }
}

function versionCatalog () {
  return { supported: SUPPORTED_VERSIONS, recommended: RECOMMENDED_VERSION }
}

module.exports = { REQUIRED_PACKETS, SUPPORTED_VERSIONS, defaultServer, validServerHost, validServerPort, validServerVersion, versionCatalog }
