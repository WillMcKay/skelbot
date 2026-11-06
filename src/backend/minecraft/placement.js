const { FACES, aimPoint, placeOnBlockVanilla } = require('../evasion/interact')
const { waitUntil, whileCrouched } = require('./movement')
const { countItem } = require('./inventory')
const { listenToServer } = require('./chat')
const { equipBestPickaxe } = require('./tools')
const { breakBlock } = require('./digging')

const REACH = 4.5
const PLAYER_HALF_WIDTH = 0.3
const FACE_NAMES = ['bottom', 'top', 'north', 'south', 'west', 'east']
const PLACE_CONFIRM_MS = 3000
const NEVER_CLICKED = new Set(['bedrock'])
const OPENS_ON_CLICK = /chest|barrel|shulker_box|furnace|smoker|_table$|anvil|door|fence_gate|button|lever|hopper|dropper|dispenser|(^|_)bed$|spawner|beacon|brewing_stand|loom|grindstone|stonecutter|lectern|bell|note_block|repeater|comparator|daylight_detector|jukebox|cake|composter|cauldron|sign|crafter|vault|decorated_pot|chiseled_bookshelf/

function frontDirection (bot) {
  const feet = bot.entity.position.floored()
  const farm = bot.findBlock({ matching: block => block?.name === 'spawner', maxDistance: 3 })
  const x = farm ? farm.position.x - feet.x : -Math.sin(bot.entity.yaw)
  const z = farm ? farm.position.z - feet.z : -Math.cos(bot.entity.yaw)

  return Math.abs(x) > Math.abs(z) ? [Math.sign(x), 0] : [0, Math.sign(z)]
}

function spotInFront (bot, height) {
  const [dx, dz] = frontDirection(bot)
  return bot.entity.position.floored().offset(dx, height, dz)
}

function overlapsBot (bot, target) {
  const { position } = bot.entity
  const height = bot.entity.height ?? 1.8

  return position.x + PLAYER_HALF_WIDTH > target.x && position.x - PLAYER_HALF_WIDTH < target.x + 1 &&
    position.z + PLAYER_HALF_WIDTH > target.z && position.z - PLAYER_HALF_WIDTH < target.z + 1 &&
    position.y + height > target.y && position.y < target.y + 1
}

function supportsFor (bot, target) {
  const eyes = bot.entity.position.offset(0, bot.entity.eyeHeight, 0)
  const supports = []

  for (const [dx, dy, dz] of FACES) {
    const block = bot.blockAt(target.offset(dx, dy, dz))
    if (block?.boundingBox !== 'block' || NEVER_CLICKED.has(block.name)) continue

    const face = FACES.findIndex(([x, y, z]) => x === -dx && y === -dy && z === -dz)
    const toEyes = eyes.minus(aimPoint(block, face, eyes))
    const facesBot = -dx * toEyes.x - dy * toEyes.y - dz * toEyes.z > 0

    if (facesBot && toEyes.norm() <= REACH) supports.push({ block, face, opens: OPENS_ON_CLICK.test(block.name) })
  }

  return supports.sort((a, b) => a.opens - b.opens)
}

async function placeAt (bot, target, { crouched }) {
  const supports = supportsFor(bot, target)
  if (supports.length === 0) throw new Error('nothing to place against')

  const reasons = []

  for (const support of supports) {
    try {
      const place = () => placeOnBlockVanilla(bot, support.block, support.face)
      const crouch = crouched || support.opens

      await (crouch ? whileCrouched(bot, place) : place())

      return { against: support.block.name, face: FACE_NAMES[support.face], crouched: crouch }
    } catch (err) {
      reasons.push(`on ${support.block.name}: ${err.message}`)
    }
  }

  throw new Error(reasons.join('; '))
}

async function clearSpot (bot, target) {
  const block = bot.blockAt(target)
  if (!block || block.name.endsWith('air')) return

  if (block.hardness === null || block.hardness < 0 || OPENS_ON_CLICK.test(block.name)) {
    throw new Error(`${target} is taken by ${block.name}, which is not mined`)
  }

  if (!await equipBestPickaxe(bot)) throw new Error(`${target} is taken by ${block.name} and there is no pickaxe to mine it`)

  console.log(`[PLACE] Mining ${block.name} at ${target} to make room.`)
  await breakBlock(bot, block)
}

async function placeHeld (bot, itemName, targets) {
  const attempts = []

  for (const target of targets) {
    if (overlapsBot(bot, target)) {
      attempts.push(`${target} is where the bot stands`)
      continue
    }

    try {
      await clearSpot(bot, target)
    } catch (err) {
      attempts.push(err.message)
      continue
    }

    for (const crouched of [false, true]) {
      const before = countItem(bot, itemName)
      const server = listenToServer(bot)

      try {
        await bot.equip(bot.inventory.items().find(item => item.name === itemName), 'hand')

        const click = await placeAt(bot, target, { crouched })
        const appeared = () => bot.blockAt(target)?.name === itemName

        if (await waitUntil(bot, () => appeared() && countItem(bot, itemName) < before, PLACE_CONFIRM_MS)) return target

        attempts.push(`${target} ${click.crouched ? 'crouched' : 'standing'} on the ${click.face} of ${click.against}: ` +
          `block ${appeared() ? 'appeared' : 'never appeared'}, ${itemName} ${before} -> ${countItem(bot, itemName)}, ${server.explain()}`)
      } catch (err) {
        attempts.push(`${target} ${crouched ? 'crouched' : 'standing'}: ${err.message}`)
      } finally {
        server.stop()
      }
    }
  }

  throw new Error(`Could not place ${itemName} (${attempts.join('; ')}).`)
}

module.exports = { spotInFront, placeHeld }
