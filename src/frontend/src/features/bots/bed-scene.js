import { drawIsoBox, hash, pulse, shade, wave, wrap } from './scene-kit'

const SIZE = 72
const SCALE = 4
const CENTER = SIZE / 2

const UNIT = 2
const WIDTH = 9
const LENGTH = 18
const PILLOW_LENGTH = 5
const LEG = 3
const LEG_TOP = 2
const FRAME_TOP = 4
const BLANKET_TOP = 7
const BOB = 2

const FACE_LIGHT = { top: 1.12, left: 0.92, right: 0.74 }
const WOOD = [106, 81, 54]
const PILLOW = [230, 227, 238]
const BLANKET = [176, 72, 82]

const Z_ROWS = ['11111', '00010', '00100', '01000', '11111']
const ZS = [{ start: 0, dx: 0 }, { start: 1 / 3, dx: 5 }, { start: 2 / 3, dx: 2 }]

const textured = (color, face, column, row) => shade(color, FACE_LIGHT[face] * (0.92 + hash(column * 13 + row * 29) * 0.16))

function drawZs (ctx, p, x, y) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  ctx.fillStyle = 'rgb(145,132,217)'

  for (const z of ZS) {
    const rise = wrap(p + z.start, 1)
    const cell = 0.7 + rise * 0.8
    ctx.globalAlpha = Math.sin(Math.PI * rise) * 0.9
    Z_ROWS.forEach((row, rowIndex) => [...row].forEach((bit, column) => {
      if (bit === '1') ctx.fillRect(x + z.dx + wave(rise, 1) * 3 + column * cell, y - rise * 18 + rowIndex * cell, cell, cell)
    }))
  }
  ctx.globalAlpha = 1
}

function createBedScene () {
  return function drawScene (ctx, p) {
    const breath = pulse(p, 2)
    const view = { scale: SCALE, unit: UNIT, x: CENTER - 9, y: 35 + wave(p, 1) * BOB }
    const wood = (face, column, row) => textured(WOOD, face, column, row)

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, SIZE * SCALE, SIZE * SCALE)

    drawIsoBox(ctx, view, [0, LEG], [WIDTH - LEG, WIDTH], [0, LEG_TOP], wood)
    drawIsoBox(ctx, view, [LENGTH - LEG, LENGTH], [0, LEG], [0, LEG_TOP], wood)
    drawIsoBox(ctx, view, [LENGTH - LEG, LENGTH], [WIDTH - LEG, WIDTH], [0, LEG_TOP], wood)
    drawIsoBox(ctx, view, [0, LENGTH], [0, WIDTH], [LEG_TOP, FRAME_TOP], wood)
    drawIsoBox(ctx, view, [0, PILLOW_LENGTH], [0, WIDTH], [FRAME_TOP, BLANKET_TOP], (face, column, row) => textured(PILLOW, face, column, row))
    drawIsoBox(ctx, view, [PILLOW_LENGTH, LENGTH], [0, WIDTH], [FRAME_TOP, BLANKET_TOP + breath * 0.7], (face, column, row) => textured(BLANKET, face, column, row))

    drawZs(ctx, p, view.x - 8, view.y - 14 - BLANKET_TOP)
  }
}

export const bedScene = { create: createBedScene, width: SIZE * SCALE, height: SIZE * SCALE, loopMs: 8000, stillFrame: 0, frameMs: 0, transparent: true }
