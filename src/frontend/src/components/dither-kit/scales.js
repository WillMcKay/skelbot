import { scaleBand, scaleLinear, scalePoint } from "d3-scale"
import { stack as d3Stack, stackOffsetExpand } from "d3-shape"

const num = (v) =>
  typeof v === "number" && Number.isFinite(v) ? v : 0

export function computeBands(data, keys, stackType) {
  if (stackType === "default") {
    const bands = {}
    let max = 0
    let min = 0
    for (const key of keys) {
      bands[key] = data.map((row) => {
        const v = num(row[key])
        if (v > max) max = v
        if (v < min) min = v
        return [0, v]
      })
    }
    const flat = max === 0 && min === 0
    return { bands, max: flat ? 1 : max, min }
  }

  const series = d3Stack()
    .keys(keys)
    .value((row, key) => num(row[key]))
    .offset(stackType === "percent" ? stackOffsetExpand : (undefined))(
    data
  )

  const bands = {}
  let max = 0
  let min = 0
  series.forEach((layer) => {
    bands[layer.key] = layer.map((point) => {
      if (point[1] > max) max = point[1]
      if (point[0] < min) min = point[0]
      return [point[0], point[1]]
    })
  })
  const flat = max === 0 && min === 0
  return { bands, max: flat ? 1 : max, min }
}

export function buildXScale(length, plotWidth) {
  return scalePoint()
    .domain(Array.from({ length }, (_, i) => i))
    .range([0, plotWidth]);
}

export function buildBandScale(length, plotWidth) {
  return scaleBand()
    .domain(Array.from({ length }, (_, i) => i))
    .range([0, plotWidth])
    .paddingInner(0.28)
    .paddingOuter(0.18);
}

export function indexAtBand(px, length, plotWidth) {
  if (length <= 0 || plotWidth <= 0) return 0
  const t = Math.max(0, Math.min(0.999, px / plotWidth))
  return Math.min(length - 1, Math.floor(t * length))
}

export function buildYScale(min, max, plotHeight) {
  const lo = Math.min(0, min)
  const hi = Math.max(0, max)
  return scaleLinear()
    .domain([lo, hi === lo ? lo + 1 : hi])
    .nice()
    .range([plotHeight, 0])
}

export function nearestIndex(px, length, plotWidth) {
  if (length <= 1 || plotWidth <= 0) return 0
  const t = Math.max(0, Math.min(1, px / plotWidth))
  return Math.round(t * (length - 1))
}
