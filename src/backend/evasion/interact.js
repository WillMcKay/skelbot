'use strict'

const { Vec3 } = require('vec3')
const { toNotchianYaw, toNotchianPitch } = require('mineflayer/lib/conversions')

const REACH = 4.5
const MAIN_HAND = 0
const OFF_HAND = 1
const OFF_HAND_SLOT = 45
const START_DIGGING = 0
const FINISH_DIGGING = 2
const FACES = [[0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0]]
const FACE_INSET = 0.001
const AIM_SETTLE_TICKS = 4

function nextSequence (client) {
  client._blockSequence = (client._blockSequence || 0) + 1
  return client._blockSequence
}

function heldIn (bot, hand) {
  return hand === MAIN_HAND ? bot.heldItem : bot.inventory.slots[OFF_HAND_SLOT]
}

function aimPoint (block, face, eyes) {
  const shapes = block.shapes?.length ? block.shapes : [[0, 0, 0, 1, 1, 1]]

  if (face === undefined) {
    return block.position.offset(...[0, 1, 2].map(axis =>
      (Math.min(...shapes.map(s => s[axis])) + Math.max(...shapes.map(s => s[axis + 3]))) / 2))
  }

  const axis = FACES[face].findIndex(v => v !== 0)
  const outward = FACES[face][axis] > 0
  const reach = s => outward ? s[axis + 3] : -s[axis]
  const outermost = Math.max(...shapes.map(reach))

  return shapes
    .filter(s => reach(s) === outermost)
    .map(s => block.position.offset(...[0, 1, 2].map(i => {
      if (i !== axis) return (s[i] + s[i + 3]) / 2
      return outward ? s[i + 3] - FACE_INSET : s[i] + FACE_INSET
    })))
    .sort((a, b) => a.distanceTo(eyes) - b.distanceTo(eyes))[0]
}

function blockAtCrosshair (bot, eyes) {
  const { yaw, pitch } = bot.entity
  const direction = new Vec3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch))
  return bot.world.raycast(eyes, direction, REACH)
}

async function aimAt (bot, block, face) {
  const eyes = bot.entity.position.offset(0, bot.entity.eyeHeight, 0)
  await bot.lookAt(aimPoint(block, face, eyes))
  await bot.waitForTicks(AIM_SETTLE_TICKS)
  const hit = blockAtCrosshair(bot, eyes)
  if (!hit || !hit.position.equals(block.position)) {
    const blocker = hit ? hit.name + ' at ' + hit.position : 'nothing in reach'
    throw new Error(block.name + ' at ' + block.position + ' is blocked by ' + blocker + ' (eyes at ' + eyes + ')')
  }
  if (face !== undefined && hit.face !== face) {
    throw new Error('that side of ' + block.name + ' at ' + block.position + ' is not visible from here')
  }
  return hit
}

function useItemOn (client, block, hit, hand) {
  const cursor = hit.intersect.minus(block.position)
  client.write('block_place', {
    hand,
    location: block.position,
    direction: hit.face,
    cursorX: cursor.x,
    cursorY: cursor.y,
    cursorZ: cursor.z,
    insideBlock: false,
    worldBorderHit: false,
    sequence: nextSequence(client)
  })
}

async function activateBlockVanilla (bot, block) {
  const hit = await aimAt(bot, block)
  const client = bot._client
  for (const hand of [MAIN_HAND, OFF_HAND]) {
    useItemOn(client, block, hit, hand)
    if (heldIn(bot, hand)) {
      client.write('use_item', {
        hand,
        sequence: nextSequence(client),
        rotation: { x: toNotchianYaw(bot.entity.yaw), y: toNotchianPitch(bot.entity.pitch) }
      })
    }
  }
}

async function placeOnBlockVanilla (bot, block, face) {
  const hit = await aimAt(bot, block, face)
  useItemOn(bot._client, block, hit, MAIN_HAND)
  bot._client.write('arm_animation', { hand: MAIN_HAND })
}

async function digBlockVanilla (bot, block, progressPerTick, until) {
  const hit = await aimAt(bot, block)
  const client = bot._client
  const dig = (status) => client.write('block_dig', {
    status,
    location: block.position,
    face: hit.face,
    sequence: nextSequence(client)
  })
  dig(START_DIGGING)
  for (let progress = 0; progress < 1 && Date.now() < until; progress += progressPerTick()) {
    client.write('arm_animation', { hand: MAIN_HAND })
    await bot.waitForTicks(1)
  }
  dig(FINISH_DIGGING)
  client.write('arm_animation', { hand: MAIN_HAND })
}

module.exports = { FACES, aimPoint, activateBlockVanilla, placeOnBlockVanilla, digBlockVanilla }
