const test = require('node:test')
const assert = require('node:assert/strict')
const { dropPlayPacketsDuringConfiguration } = require('./vanilla')

function fakeClient (state) {
  const client = { state, sent: [], write: name => { client.sent.push(name) } }
  dropPlayPacketsDuringConfiguration(client)
  return client
}

test('tick_end is sent during play', () => {
  const client = fakeClient('play')

  client.write('tick_end', {})

  assert.deepEqual(client.sent, ['tick_end'])
})

test('play packets are dropped during configuration, where they would be malformed', () => {
  const client = fakeClient('configuration')

  for (const name of ['tick_end', 'chat_command', 'chat_command_signed', 'teleport_confirm', 'block_place', 'use_item', 'arm_animation']) {
    client.write(name, {})
  }

  assert.deepEqual(client.sent, [])
})

test('configuration packets still go out during configuration', () => {
  const client = fakeClient('configuration')

  for (const name of ['settings', 'keep_alive', 'pong', 'finish_configuration']) {
    client.write(name, {})
  }

  assert.deepEqual(client.sent, ['settings', 'keep_alive', 'pong', 'finish_configuration'])
})

test('leaving play and joining still go out', () => {
  const play = fakeClient('play')
  const login = fakeClient('login')

  play.write('configuration_acknowledged', {})
  login.write('login_acknowledged', {})

  assert.deepEqual(play.sent, ['configuration_acknowledged'])
  assert.deepEqual(login.sent, ['login_acknowledged'])
})
