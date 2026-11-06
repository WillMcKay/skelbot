const test = require('node:test')
const assert = require('node:assert/strict')
const { InputError } = require('./errors')
const minecraftData = require('minecraft-data')
const { REQUIRED_PACKETS, SUPPORTED_VERSIONS, defaultServer, validServerHost, validServerPort, validServerVersion, versionCatalog } = require('./server-settings')

test('new bots default to DonutSMP', () => {
  assert.deepEqual(defaultServer(), { serverHost: 'donutsmp.net', serverPort: 25565, serverVersion: '1.21.11' })
})

test('accepts addresses and IPs, refuses junk', () => {
  assert.equal(validServerHost(' donutsmp.net '), 'donutsmp.net')
  assert.equal(validServerHost('192.168.1.20'), '192.168.1.20')
  for (const value of ['', 'has space.net', 'http://x.net', '-bad.net', 5]) assert.throws(() => validServerHost(value), InputError)
})

test('ports must be whole numbers in range', () => {
  assert.equal(validServerPort('25565'), 25565)
  for (const value of [0, 70000, 1.5, 'abc', '']) assert.throws(() => validServerPort(value), InputError)
})

test('only supported versions are accepted', () => {
  assert.equal(validServerVersion(' 1.21.11 '), '1.21.11')
  for (const value of ['', 'latest', '1.20.4', '1.8.8', '1.21.1', 5]) assert.throws(() => validServerVersion(value), InputError)
})

test('every supported version has the packets the bot sends', () => {
  for (const version of SUPPORTED_VERSIONS) {
    const packets = JSON.stringify(minecraftData(version).protocol.play.toServer.types.packet)
    for (const packet of REQUIRED_PACKETS) assert.ok(packets.includes(`"${packet}"`), `${version} lacks ${packet}`)
  }
})

test('versions older than 1.21.4 lack them', () => {
  const packets = JSON.stringify(minecraftData('1.21.3').protocol.play.toServer.types.packet)
  assert.equal(packets.includes('"player_loaded"'), false)
})

test('the recommended version is offered and is the default', () => {
  const { supported, recommended } = versionCatalog()
  assert.ok(supported.includes(recommended))
  assert.equal(defaultServer().serverVersion, recommended)
})
