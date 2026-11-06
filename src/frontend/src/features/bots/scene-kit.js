import { BAYER4 } from '@/components/dither-kit/pixel'

export const SCENE_WIDTH = 1920
export const SCENE_HEIGHT = 380

export const CELL = 6

export const isLit = (density, column, row) => density > BAYER4[row & 3][column & 3]
export const wrap = (value, size) => ((value % size) + size) % size
export const wave = (p, cycles, phase = 0) => Math.sin(Math.PI * 2 * (p * cycles + phase))
export const pulse = (p, cycles, phase = 0) => 0.5 + 0.5 * wave(p, cycles, phase)

export function hash (seed) {
  const x = Math.sin(seed * 91.7 + 3.1) * 24634.6345
  return x - Math.floor(x)
}

export const pick = (list, seed) => list[Math.floor(hash(seed) * list.length)]

export function rect (ctx, x, y, width, height, color, alpha = 1) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), width, height)
  ctx.globalAlpha = 1
}

export function sprite (width, height, paint) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  paint(canvas.getContext('2d'))
  return canvas
}

export function paintRows (ctx, rows, palette, unit, originX = 0, originY = 0) {
  rows.forEach((row, y) => [...row].forEach((key, x) => {
    const color = palette[key]
    if (color) rect(ctx, originX + x * unit, originY + y * unit, unit, unit, Array.isArray(color) ? pick(color, x * 31 + y * 7) : color)
  }))
}

export const rowsSprite = (rows, palette, unit) => sprite(rows[0].length * unit, rows.length * unit, ctx => paintRows(ctx, rows, palette, unit))

export function drawIsoBox (ctx, { scale, unit, x, y }, [a0, a1], [b0, b1], [z0, z1], paint) {
  const point = (a, b, z) => [x + (a - b) * unit, y + (a + b) * unit / 2 - z * unit]
  const alongA = [unit, unit / 2]
  const alongB = [-unit, unit / 2]
  const down = [0, unit]

  const face = (name, origin, across, drop, columns, height) => {
    const rows = Math.ceil(height)
    const step = height / rows
    ctx.setTransform(scale * across[0], scale * across[1], scale * drop[0] * step, scale * drop[1] * step, scale * origin[0], scale * origin[1])
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        ctx.fillStyle = paint(name, column, row)
        ctx.fillRect(column, row, 1.03, 1.03)
      }
    }
  }

  face('left', point(a0, b1, z1), alongA, down, a1 - a0, z1 - z0)
  face('right', point(a1, b0, z1), alongB, down, b1 - b0, z1 - z0)
  face('top', point(a0, b0, z1), alongA, alongB, a1 - a0, b1 - b0)
}

export function shade ([r, g, b], amount) {
  return `rgb(${Math.round(r * amount)},${Math.round(g * amount)},${Math.round(b * amount)})`
}
