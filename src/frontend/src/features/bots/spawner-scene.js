import { drawIsoBox, hash, pulse, shade, wave, wrap } from './scene-kit'

const SIZE = 72
const SCALE = 4
const CENTER = SIZE / 2

const CELLS = 9
const UNIT = 3.1
const OPEN_ROW = 'F.B.B.B.F'
const BAR_ROW = 'FBBBBBBBF'
const CAGE_ROWS = ['FFFFFFFFF', OPEN_ROW, BAR_ROW, OPEN_ROW, BAR_ROW, OPEN_ROW, BAR_ROW, OPEN_ROW, 'FFFFFFFFF']
const BOB = 2

const FACE_LIGHT = { top: 1.2, left: 0.9, right: 0.68 }
const CAGE_COLORS = { F: [58, 80, 98], B: [34, 50, 64] }

const EMBER_DARK = [58, 26, 18]
const LAVA = [214, 112, 46]
const LAVA_LIT = [255, 196, 106]

const EMBERS = Array.from({ length: 14 }, (_, i) => ({ x: 8 + hash(i * 23) * 56, start: hash(i * 29), cycles: 1 + i % 3, sway: 1 + hash(i * 3.3) * 2.5, size: i % 3 === 0 ? 2 : 1.25 }))

const fireColor = heat => {
  const [from, to, blend] = heat < 0.5 ? [EMBER_DARK, LAVA, heat * 2] : [LAVA, LAVA_LIT, heat * 2 - 1]
  return from.map((channel, index) => channel + (to[index] - channel) * blend)
}

function paintFace (p, name, column, row) {
  const key = CAGE_ROWS[row][column]
  const light = FACE_LIGHT[name]

  if (key !== '.') return shade(CAGE_COLORS[key], light * (0.92 + hash(column * 13 + row * 29 + light) * 0.16))

  const roll = pulse(p, 3, row / CELLS + hash(column * 3.1 + row * 7.3 + light) * 0.25)
  const center = 1 - Math.hypot(column - 4, row - 4) / 5.7
  return shade(fireColor(Math.min(1, center * 0.75 + roll * 0.55)), Math.min(1, light + 0.15))
}

function drawEmbers (ctx, p, top) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  ctx.fillStyle = 'rgb(232,140,60)'

  for (const ember of EMBERS) {
    const rise = wrap(p * ember.cycles + ember.start, 1)
    ctx.globalAlpha = Math.sin(Math.PI * rise) * 0.8
    ctx.fillRect(ember.x + wave(rise, 1, ember.start) * ember.sway, top + 16 - rise * 24, ember.size, ember.size)
  }
  ctx.globalAlpha = 1
}

function createSpawnerScene () {
  return function drawScene (ctx, p) {
    const top = CENTER - CELLS * UNIT + wave(p, 1) * BOB
    const view = { scale: SCALE, unit: UNIT, x: CENTER, y: top + CELLS * UNIT }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, SIZE * SCALE, SIZE * SCALE)

    drawIsoBox(ctx, view, [0, CELLS], [0, CELLS], [0, CELLS], (name, column, row) => paintFace(p, name, column, row))
    drawEmbers(ctx, p, top)
  }
}

export const spawnerScene = { create: createSpawnerScene, width: SIZE * SCALE, height: SIZE * SCALE, loopMs: 6000, stillFrame: 0, frameMs: 0, transparent: true }
