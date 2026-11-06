import { CELL, SCENE_HEIGHT, SCENE_WIDTH, hash, isLit, paintRows, pick, rect, rowsSprite, sprite, wave, wrap } from './scene-kit'

const S = 12
const GROUND_Y = 276
const SKY_HEIGHT = 340
const FULL_HEIGHT = SCENE_HEIGHT + SKY_HEIGHT
const FLAT_RANGE = [26, 118]

const SAND = ['#f0e0ab', '#ebd9a2', '#e5d199']
const FIELD = ['#e6d197', '#e0ca8e', '#dac386']
const DEEP_SAND = ['#d9c083', '#d2b87a', '#ccb072']
const SANDSTONE = ['#e2c98c', '#dcc183', '#d6ba7a']
const CUT_SANDSTONE = ['#efdca6', '#ead59e']
const PATH = ['#cdb67c', '#c5ad72']
const ORANGE_TERRACOTTA = '#c8702c'
const OBSIDIAN = ['#1d1428', '#241a33']
const CRYING_OBSIDIAN = ['#3b1a7a', '#5a2fb0']
const NETHERRACK = ['#6e2f2f', '#5e2828']
const BONE_BLOCK = ['#ece7d8', '#ddd7c4']
const SUGAR_CANE = ['#7aa85a', '#6a9a50']
const WATER = { lit: '#f2b27a', top: '#7a80b8', deep: '#5a6298' }
const DEAD_BUSH = '#7a5a3a'
const CACTUS_FLOWER = '#ff9ad0'
const LAVA = { lit: '#ffb45c', base: '#e8772e' }

const SUNSET_TINT = 'rgba(120,52,60,0.3)'

function sunsetSprite (paint) {
  return sprite(SCENE_WIDTH, SCENE_HEIGHT, ctx => {
    paint(ctx)
    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = SUNSET_TINT
    ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT)
  })
}

const SURFACE = Array.from({ length: Math.ceil(SCENE_WIDTH / S) }, (_, column) => {
  const outside = Math.max(FLAT_RANGE[0] - column, column - FLAT_RANGE[1], 0)
  const roll = Math.sin(column * 0.0465 + 1.2) * 1.9 + Math.sin(column * 0.14 + 0.4) * 0.8
  return GROUND_Y + Math.round(roll * Math.min(outside / 6, 1)) * S
})

const groundAt = x => SURFACE[Math.min(Math.max(Math.floor(x / S), 0), SURFACE.length - 1)]

const TEMPLE_ROWS = [
  '.TTT.............TTT.',
  'SSSSS....TTT....SSSSS',
  'SOOOS...PPPPP...SOOOS',
  'SOSOS..QQQQQQQ..SOSOS',
  'SOOOS.PPEEEEEPP.SOOOS',
  'SSOSSQQQEOEOEQQQSSOSS',
  'SOSOSWWWEEEEEWWWSOSOS',
  'SSOSSWWWErrrEWWWSSOSS',
  'SSSSSWWWErDrEWWWSSSSS',
  'SSSSSWWWErDrEWWWSSSSS',
  'SSSSSSSSEEEEESSSSSSSS'
]

const TEMPLE_PALETTE = {
  S: SANDSTONE,
  T: CUT_SANDSTONE,
  E: CUT_SANDSTONE,
  O: ORANGE_TERRACOTTA,
  P: ['#dec587', '#d8be7e', '#d2b776'],
  Q: ['#cfb476', '#c9ae6f', '#c3a868'],
  W: ['#d6bc7c', '#d0b574', '#caaf6d'],
  r: ['#ad9460', '#a58c59'],
  D: '#1e140c'
}

const TEMPLE = { x: 840, y: GROUND_Y - TEMPLE_ROWS.length * S, width: TEMPLE_ROWS[0].length * S }

const TALL_HOUSE_ROWS = [
  '.TTTTT.',
  '.SSGSS.',
  'OOOOOOO',
  'SSSSSSS',
  'SGSSSGS',
  'SSSdSSS',
  'SSSdSSS'
]

const LOW_HOUSE_ROWS = [
  'TTTTT',
  'SSSSS',
  'SGSGS',
  'SSdSS',
  'SSdSS'
]

const WELL_ROWS = [
  'TTTTT',
  '.S.S.',
  'TSWST',
  'SSSSS'
]

const RUINED_PORTAL_ROWS = [
  '.OOO...',
  'C...O..',
  'O......',
  'O....C.',
  'O....O.',
  'C....O.',
  'OOOOOOC',
  'NNOOMNN'
]

const FOSSIL_ROWS = [
  '...BBBBBBBBB..',
  '..B.B.B.B.B.B.',
  '.B..B.B.B.B.B.',
  'BB..B.B.B.B.B.',
  'BB..B.B.B.B.B.'
]

const BUILDING_PALETTE = {
  S: SANDSTONE,
  T: CUT_SANDSTONE,
  O: ORANGE_TERRACOTTA,
  d: ['#8e6238', '#7f5630'],
  G: '#a9c4c9',
  W: WATER.top
}

const atGround = rows => GROUND_Y - rows.length * S

const PORTAL_X = 1332

const STRUCTURES = [
  { rows: TALL_HOUSE_ROWS, x: 396, palette: BUILDING_PALETTE },
  { rows: LOW_HOUSE_ROWS, x: 492, palette: BUILDING_PALETTE },
  { rows: TALL_HOUSE_ROWS, x: 564, palette: BUILDING_PALETTE },
  { rows: WELL_ROWS, x: 672, palette: BUILDING_PALETTE },
  { rows: RUINED_PORTAL_ROWS, x: PORTAL_X, palette: { O: OBSIDIAN, C: CRYING_OBSIDIAN, N: NETHERRACK, M: '#e6b84f' } }
].map(structure => ({ ...structure, y: atGround(structure.rows) }))

const PORTAL_TEARS = [[PORTAL_X + S / 2, atGround(RUINED_PORTAL_ROWS) + S], [PORTAL_X + S * 5.5, atGround(RUINED_PORTAL_ROWS) + S * 3]]

const FOSSIL = { x: 1452, y: GROUND_Y + 24 }

const POND = { x: 1140, y: GROUND_Y + 12, width: 144, rows: 3 }
const CANES = [[POND.x - S, 3], [POND.x + POND.width, 2]]

const LAVA_POOL = { x: 756, y: GROUND_Y + S, blocks: 3 }

const CACTI = [[72, 3, true], [168, 2], [252, 3], [312, 2, true], [1116, 2], [1428, 3, true], [1500, 2], [1596, 3], [1704, 3, true], [1848, 2]]
const FOREGROUND_CACTI = [[132, 5, 372, true], [1788, 5, 372], [1668, 5, 384, true]]

const CACTUS_PALETTE = { G: ['#3f8f3a', '#4a9a43', '#378233'], P: CACTUS_FLOWER }

function paintCactus (ctx, [x, blocks, base, flower], ground) {
  const hasFlower = typeof base === 'boolean' ? base : flower
  const bottom = typeof base === 'number' ? base : ground
  const rows = [...(hasFlower ? ['P'] : []), ...Array.from({ length: blocks }, () => 'G')]
  paintRows(ctx, rows, CACTUS_PALETTE, S, x, bottom - rows.length * S)
}

const CLOUD_SPAN = 2440

const CLOUD_SHAPES = [
  ['00111100000', '01111111100', '11111111111', '00111111110'],
  ['0001110000000', '0111111110000', '1111111111111', '0011111111100'],
  ['001111000', '111111111', '011111100']
]

const CLOUDS = Array.from({ length: 7 }, (_, i) => ({
  shape: CLOUD_SHAPES[i % 3],
  x: hash(i * 11) * CLOUD_SPAN,
  y: 24 + Math.floor(hash(i * 3) * 38) * S,
  cycles: i % 2 ? 2 : 1,
  alpha: i % 2 ? 0.85 : 0.7
}))

function pathCenter (y) {
  return TEMPLE.x + TEMPLE.width / 2 - (y - GROUND_Y) * 0.4
}

const DEAD_BUSHES = Array.from({ length: 34 }, (_, i) => {
  const x = Math.floor(hash(i * 3.9) * SCENE_WIDTH)
  const base = i % 3 === 0 ? groundAt(x) : Math.max(groundAt(x), GROUND_Y + 10 + hash(i * 2.2) * 88)
  return { x, base, height: 8 + hash(i * 1.7) * 8, phase: hash(i * 6.3) }
})
  .filter(({ x, base }) => {
    const onPond = x > POND.x - 12 && x < POND.x + POND.width + 12 && base < POND.y + 44
    const onLava = x > LAVA_POOL.x - 12 && x < LAVA_POOL.x + LAVA_POOL.blocks * S + 12 && base < LAVA_POOL.y + 2 * S
    const onPath = Math.abs(x - pathCenter(base)) < 24 + (base - GROUND_Y) * 0.16
    const onFront = base <= GROUND_Y + 4 && x > TEMPLE.x - 8 && x < TEMPLE.x + TEMPLE.width + 8
    return !onPond && !onLava && !onPath && !onFront
  })
  .sort((a, b) => a.base - b.base)

const SUN = { x: 1476, y: 156 + SKY_HEIGHT }

const SKY_STOPS = [
  [0, [58, 63, 122]],
  [0.22, [95, 76, 133]],
  [0.45, [138, 90, 142]],
  [0.6, [186, 113, 116]],
  [0.75, [232, 137, 90]],
  [0.88, [244, 166, 100]],
  [1, [255, 196, 110]]
]

const SKY_BANDS = 24

function skyColorAt (t) {
  const upper = Math.max(1, SKY_STOPS.findIndex(([at]) => at >= t))
  const [fromAt, from] = SKY_STOPS[upper - 1]
  const [toAt, to] = SKY_STOPS[upper]
  const blend = (t - fromAt) / (toAt - fromAt)
  return `rgb(${from.map((channel, index) => Math.round(channel + (to[index] - channel) * blend))})`
}

function paintSky (ctx) {
  const rows = Math.ceil((GROUND_Y + SKY_HEIGHT) / CELL)
  const columns = SCENE_WIDTH / CELL

  rect(ctx, 0, 0, SCENE_WIDTH, FULL_HEIGHT, skyColorAt(1))
  for (let row = 0; row < rows; row++) {
    const position = (row + 0.5) / rows * SKY_BANDS
    const band = Math.floor(position)
    const from = skyColorAt(band / SKY_BANDS)
    const to = skyColorAt((band + 1) / SKY_BANDS)
    for (let column = 0; column < columns; column++) {
      rect(ctx, column * CELL, row * CELL, CELL, CELL, isLit(position - band, column, row) ? to : from)
    }
  }

  rect(ctx, SUN.x - 36, SUN.y - 36, 72, 72, '#ffd98a')
  rect(ctx, SUN.x - 24, SUN.y - 24, 48, 48, '#fff3c4')
}

function paintLand (ctx) {
  const strata = ['#d9a679', '#c98f63', '#e5bd8e', '#b97c55', '#d3996c']
  for (let column = 0; column * S < SCENE_WIDTH; column++) {
    const roll = Math.sin(column * 0.055 + 0.6) + Math.sin(column * 0.125 + 2.1) * 0.5
    const plateau = roll > 0.75 ? 6 : roll > 0.2 ? 4 : roll > -0.5 ? 2 : 1
    for (let y = 252 - plateau * S; y < SCENE_HEIGHT; y += S) {
      rect(ctx, column * S, y, S, S, strata[Math.floor(y / S) % strata.length])
    }

    const dune = Math.sin(column * 0.07 + 2.2) + Math.sin(column * 0.183 + 2.2) * 0.35
    for (let y = 252 + Math.round(dune) * S; y < SCENE_HEIGHT; y += S) {
      rect(ctx, column * S, y, S, S, pick(['#ecd5a0', '#e7cf98'], column * 5 + y))
    }
  }
}

function paintWorld (ctx) {
  SURFACE.forEach((top, column) => {
    for (let y = top, row = 0; y < SCENE_HEIGHT; y += S, row++) {
      const seed = column * 13 + row * 7
      const onPath = Math.abs(column * S + S / 2 - pathCenter(y)) < 14 + (y - GROUND_Y) * 0.14
      const depth = y + hash(seed) * 26 + Math.sin(column * 0.09 + y * 0.03) * 8
      const shades = depth < 302 ? SAND : depth < 344 ? FIELD : DEEP_SAND
      rect(ctx, column * S, y, S, S, pick(onPath ? PATH : row === 0 ? SAND : shades, seed))
    }
  })

  paintRows(ctx, TEMPLE_ROWS, TEMPLE_PALETTE, S, TEMPLE.x, TEMPLE.y)
  for (const { rows, palette, x, y } of STRUCTURES) paintRows(ctx, rows, palette, S, x, y)
  paintRows(ctx, FOSSIL_ROWS, { B: BONE_BLOCK }, S, FOSSIL.x, FOSSIL.y)
  for (const cactus of CACTI) paintCactus(ctx, cactus, groundAt(cactus[0]))
}

function paintForeground (ctx) {
  for (const cactus of FOREGROUND_CACTI) paintCactus(ctx, cactus)

  for (let column = 0; column * S < SCENE_WIDTH; column++) {
    const roll = Math.sin(column * 0.0315 + 2) + Math.sin(column * 0.082 + 2) * 0.35
    for (let y = 360 + Math.round(roll) * S; y < SCENE_HEIGHT; y += S) {
      rect(ctx, column * S, y, S, S, pick(DEEP_SAND, column * 5 + y))
    }
  }
}

function paintVignette (ctx) {
  const rows = FULL_HEIGHT / CELL
  const columns = SCENE_WIDTH / CELL

  ctx.fillStyle = 'rgba(30,8,20,0.2)'
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = (column + 0.5) * CELL / SCENE_WIDTH - 0.5
      const y = ((row + 0.5) * CELL / FULL_HEIGHT - 0.5) * 2
      const density = (Math.hypot(x * 2, y) - 1.02) / 0.5
      if (isLit(density, column, row)) ctx.fillRect(column * CELL, row * CELL, CELL, CELL)
    }
  }
}

const EMBERS = Array.from({ length: 12 }, (_, i) => ({ dx: hash(i * 23) * LAVA_POOL.blocks * S, start: hash(i * 29), cycles: 20 + i % 3 * 5 }))

function buildSprites () {
  return {
    sky: sprite(SCENE_WIDTH, FULL_HEIGHT, paintSky),
    land: sunsetSprite(paintLand),
    world: sunsetSprite(paintWorld),
    foreground: sunsetSprite(paintForeground),
    vignette: sprite(SCENE_WIDTH, FULL_HEIGHT, paintVignette),
    clouds: CLOUDS.map(cloud => rowsSprite(cloud.shape, { 1: '#f0a488' }, S))
  }
}

function drawLava (ctx, p) {
  const shift = Math.floor(p * 60)

  for (let block = 0; block < LAVA_POOL.blocks; block++) {
    rect(ctx, LAVA_POOL.x + block * S, LAVA_POOL.y, S, S, wrap(block + shift, 3) === 0 ? LAVA.lit : LAVA.base)
  }

  for (const ember of EMBERS) {
    const rise = wrap(p * ember.cycles + ember.start, 1)
    rect(ctx, LAVA_POOL.x + ember.dx, LAVA_POOL.y - rise * 110, 2, 2, LAVA.lit, (1 - rise) * 0.8)
  }
}

function drawClouds (ctx, sprites, p) {
  CLOUDS.forEach((cloud, index) => {
    ctx.globalAlpha = cloud.alpha
    ctx.drawImage(sprites.clouds[index], Math.round(wrap(cloud.x - p * cloud.cycles * CLOUD_SPAN, CLOUD_SPAN) - 260), cloud.y)
  })
  ctx.globalAlpha = 1
}

function drawPond (ctx, p) {
  const columns = POND.width / S
  const shimmer = Math.floor(p * 7 * 30)

  for (let column = 0; column < columns; column++) {
    const lit = wrap(column + shimmer, 7) < 2
    const inset = column === 0 || column === columns - 1 ? 1 : 0
    for (let row = inset; row < POND.rows - inset; row++) {
      const color = row === inset && lit ? WATER.lit : row < 2 ? WATER.top : WATER.deep
      rect(ctx, POND.x + column * S, POND.y + row * S, S, S, color)
    }
  }

  CANES.forEach(([x, blocks], index) => {
    for (let block = 0; block < blocks; block++) {
      rect(ctx, x, POND.y + S - (block + 1) * S, S, S, pick(SUGAR_CANE, block + index))
    }
  })
}

function drawPortalTears (ctx, p) {
  PORTAL_TEARS.forEach(([x, y], index) => {
    const fall = wrap(p * 20 + index * 0.4, 1)
    rect(ctx, x, y + fall * 26, 3, 5, '#a877f0', (1 - fall) * 0.9)
  })
}

function drawDeadBushes (ctx, p) {
  for (const { x, base, height, phase } of DEAD_BUSHES) {
    const sway = wave(p, 20, phase) * 0.8
    rect(ctx, x + sway * 0.4, base - height, 2, height, DEAD_BUSH)
    rect(ctx, x + sway - 4, base - height + 1, 5, 2, DEAD_BUSH)
    rect(ctx, x + sway * 0.8 + 2, base - height + 5, 5, 2, DEAD_BUSH)
    rect(ctx, x - 3, base - 5, 3, 2, DEAD_BUSH)
  }
}

function createDesertScene () {
  const sprites = buildSprites()

  return function drawScene (ctx, p) {
    ctx.drawImage(sprites.sky, 0, 0)
    drawClouds(ctx, sprites, p)

    ctx.save()
    ctx.translate(0, SKY_HEIGHT)
    ctx.drawImage(sprites.land, 0, 0)
    ctx.drawImage(sprites.world, 0, 0)
    drawPond(ctx, p)
    drawLava(ctx, p)
    drawPortalTears(ctx, p)
    drawDeadBushes(ctx, p)
    ctx.drawImage(sprites.foreground, 0, 0)
    ctx.restore()

    ctx.drawImage(sprites.vignette, 0, 0)
  }
}

const OPEN_SAND = { x: [420, 1440], y: [306, 352] }
const BELOW_POND = POND.y + POND.rows * S + 16

function groundSpot (across, down) {
  const x = OPEN_SAND.x[0] + (OPEN_SAND.x[1] - OPEN_SAND.x[0]) * across
  const y = OPEN_SAND.y[0] + (OPEN_SAND.y[1] - OPEN_SAND.y[0]) * down
  const atPond = x > POND.x - 28 && x < POND.x + POND.width + 28
  return { x, y: (atPond ? Math.max(y, BELOW_POND) : y) + SKY_HEIGHT }
}

export const desertScene = { create: createDesertScene, width: SCENE_WIDTH, height: FULL_HEIGHT, loopMs: 60000, stillFrame: 0, color: '#3a3f7a', groundSpot }
