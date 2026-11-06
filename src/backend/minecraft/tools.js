const { getAttributeValue } = require('prismarine-physics/lib/attribute')

const PICKAXE_TIERS = ['netherite', 'diamond', 'iron', 'golden', 'stone', 'wooden']

function enchantmentsOf (bot, item) {
  if (!item) return []

  let raw

  try {
    raw = item.enchants
  } catch {
    return []
  }

  if (Array.isArray(raw)) return raw

  return (raw?.enchantments ?? []).map(({ id, level }) => ({
    name: bot.registry.enchantments[id]?.name ?? null,
    lvl: level
  }))
}

function pickaxeRank (bot, item) {
  const silkTouch = enchantmentsOf(bot, item).some(({ name }) => name === 'silk_touch')
  const tier = PICKAXE_TIERS.indexOf(item.name.replace('_pickaxe', ''))

  return (silkTouch ? 0 : PICKAXE_TIERS.length) + tier
}

async function equipBestPickaxe (bot) {
  const [best] = bot.inventory.items()
    .filter(item => item.name.endsWith('_pickaxe'))
    .sort((a, b) => pickaxeRank(bot, a) - pickaxeRank(bot, b))

  if (!best) return null

  await bot.equip(best, 'hand')

  return best
}

function describeTool (bot, item) {
  if (!item) return 'empty hand'

  const enchants = enchantmentsOf(bot, item).map(({ name, lvl }) => `${name} ${lvl}`)

  return enchants.length ? `${item.name} (${enchants.join(', ')})` : `${item.name} (no enchantments)`
}

function blockBreakSpeed (bot) {
  const attributes = bot.entity.attributes ?? {}
  const key = Object.keys(attributes).find(name => name.endsWith('block_break_speed'))

  return key ? getAttributeValue(attributes[key]) : 1
}

function digProgress (bot, block) {
  const eyes = bot.blockAt(bot.entity.position.offset(0, bot.entity.eyeHeight, 0))

  const ms = block.digTime(
    bot.heldItem?.type ?? null,
    bot.game.gameMode === 'creative',
    ['water', 'flowing_water'].includes(eyes?.name),
    !bot.entity.onGround,
    enchantmentsOf(bot, bot.heldItem),
    bot.entity.effects
  )

  return blockBreakSpeed(bot) * 50 / ms
}

module.exports = { equipBestPickaxe, describeTool, digProgress }
