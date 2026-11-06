import { createContext, use, useCallback, useMemo, useState } from "react"
import { seedOfColor } from "./palette"
import {
  buildBandScale,
  buildXScale,
  buildYScale,
  computeBands,
  indexAtBand,
  nearestIndex,
} from "./scales";

const ChartContext = createContext(null)

const ROOT_OF = {
  area: "<AreaChart />",
  bar: "<BarChart />",
  line: "<LineChart />",
  pie: "<PieChart />",
  radar: "<RadarChart />",
}

export function useChart() {
  const ctx = use(ChartContext)
  if (!ctx) {
    throw new Error(
      "Chart parts must be used within a chart root (e.g. <AreaChart />)."
    )
  }
  return ctx
}

export function useChartPart(part, kind) {
  const ctx = use(ChartContext)
  if (!ctx) {
    const where = kind
      ? ROOT_OF[Array.isArray(kind) ? kind[0] : kind]
      : "a chart root"
    throw new Error(`<${part} /> must be used within ${where}.`)
  }
  if (kind) {
    const allowed = Array.isArray(kind) ? kind : [kind]
    if (!allowed.includes(ctx.chartType)) {
      throw new Error(
        `<${part} /> is not valid inside ${ROOT_OF[ctx.chartType]} — it belongs in ${allowed
          .map((k) => ROOT_OF[k])
          .join(" or ")}.`
      )
    }
  }
  return ctx
}

export { ChartContext }

export function useRevision(data, token) {
  const [prev, setPrev] = useState({ data, token, revision: 0 })
  if (prev.data !== data || prev.token !== token) {
    const next = { data, token, revision: prev.revision + 1 }
    setPrev(next)
    return next.revision
  }
  return prev.revision
}

export function useChartController(
  {
    chartType,
    data,
    config,
    stackType,
    dimensions,
    margins,
    animate = true,
    animationDuration = 900,
    replayToken = 0,
    markerIndex = null,
    hovered = false,
    bloom = "off",
    bloomOnHover = false,
    defaultSelectedDataKey = null,
    onSelectionChange
  }
) {
  const configKeys = useMemo(() => Object.keys(config), [config])
  const revision = useRevision(data, replayToken)

  const [selectedDataKey, setSelectedDataKey] = useState(defaultSelectedDataKey)
  const [focusDataKey, setFocusDataKey] = useState(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [cursorX, setCursorX] = useState(0)
  const [isMouseInChart, setMouseInChart] = useState(false)
  const [seriesSpecs, setSeriesSpecs] = useState({})

  const registerSeries = useCallback((spec) => {
    setSeriesSpecs((prev) => {
      const cur = prev[spec.dataKey]
      return cur &&
        cur.kind === spec.kind &&
        cur.variant === spec.variant &&
        cur.strokeVariant === spec.strokeVariant
        ? prev
        : { ...prev, [spec.dataKey]: spec }
    })
  }, [])
  const unregisterSeries = useCallback((dataKey) => {
    setSeriesSpecs((prev) => {
      if (!(dataKey in prev)) return prev
      const next = { ...prev }
      delete next[dataKey]
      return next
    })
  }, [])

  const selectDataKey = useCallback(
    (key) => {
      setSelectedDataKey(key)
      onSelectionChange?.(key)
    },
    [onSelectionChange]
  )

  const { top: mTop, right: mRight, bottom: mBottom, left: mLeft } = margins
  const stableMargins = useMemo(
    () => ({ top: mTop, right: mRight, bottom: mBottom, left: mLeft }),
    [mTop, mRight, mBottom, mLeft]
  )

  const plotWidth = Math.max(0, dimensions.width - mLeft - mRight)
  const plotHeight = Math.max(0, dimensions.height - mTop - mBottom)
  const ready = plotWidth > 0 && plotHeight > 0

  const [entrance, setEntrance] = useState({ revision, done: !animate })
  if (entrance.revision !== revision) {
    setEntrance({ revision, done: !animate })
  }
  const entranceDone = entrance.revision === revision ? entrance.done : !animate
  const markEntranceDone = useCallback(
    () => setEntrance({ revision, done: true }),
    [revision]
  )

  const { bands, max, min } = useMemo(
    () => computeBands(data, configKeys, stackType),
    [data, configKeys, stackType]
  )

  const isBar = chartType === "bar"
  const xPoint = useMemo(
    () => buildXScale(data.length, plotWidth),
    [data.length, plotWidth]
  )
  const xBand = useMemo(
    () => buildBandScale(data.length, plotWidth),
    [data.length, plotWidth]
  )
  const bandwidth = isBar ? xBand.bandwidth() : 0
  const xCenter = useCallback(
    (i) =>
      isBar ? (xBand(i) ?? 0) + xBand.bandwidth() / 2 : (xPoint(i) ?? 0),
    [isBar, xBand, xPoint]
  )
  const indexAtX = useCallback(
    (px) =>
      isBar
        ? indexAtBand(px, data.length, plotWidth)
        : nearestIndex(px, data.length, plotWidth),
    [isBar, data.length, plotWidth]
  )
  const stacked = stackType === "stacked" || stackType === "percent"
  const barSlot = useCallback(
    (i, si, n) => {
      const center = xCenter(i)
      if (stacked) {
        const w = bandwidth * 0.9
        return { x: center - w / 2, width: w }
      }
      const slot = bandwidth / Math.max(n, 1)
      return {
        x: center - bandwidth / 2 + si * slot + slot * 0.08,
        width: slot * 0.84,
      }
    },
    [xCenter, stacked, bandwidth]
  )
  const y = useMemo(
    () => buildYScale(min, max, plotHeight),
    [min, max, plotHeight]
  )

  const seedOf = useCallback(
    (key) => seedOfColor(config[key]?.color ?? "grey"),
    [config]
  )

  const common = useMemo(() => ({
    names: configKeys,
    labelOf: (n) => config[n]?.label ?? n,
    seedOf,
    selectedDataKey,
    selectDataKey,
    focusDataKey,
    setFocusDataKey,
    hoverIndex,
    ready,
    tooltipLeft: Math.max(48, Math.min(plotWidth + mLeft - 48, cursorX)),
    tooltipTop: (() => {
      const floor = mTop
      if (hoverIndex == null) return floor
      let minY = Number.POSITIVE_INFINITY
      for (const key of configKeys) {
        const b = bands[key]?.[hoverIndex]
        if (b) minY = Math.min(minY, y(b[1]))
      }
      if (!Number.isFinite(minY)) return floor
      return Math.max(floor, mTop + minY)
    })(),
    heading: (i, labelKey) =>
      labelKey ? String(data[i]?.[labelKey] ?? "") : null,
    itemsAt: (i) =>
      configKeys.map((name) => {
        const raw = data[i]?.[name]
        return {
          name,
          label: config[name]?.label ?? name,
          value: typeof raw === "number" ? raw : 0,
          seed: seedOf(name),
          dimmed: (() => {
            const emphasis = selectedDataKey ?? focusDataKey
            return emphasis !== null && emphasis !== name
          })(),
        }
      }),
  }), [
    configKeys,
    config,
    seedOf,
    selectedDataKey,
    selectDataKey,
    focusDataKey,
    setFocusDataKey,
    hoverIndex,
    ready,
    plotWidth,
    mLeft,
    mTop,
    cursorX,
    bands,
    y,
    data,
  ])

  return useMemo(() => ({
    chartType,
    config,
    configKeys,
    data,
    dataLength: data.length,
    stackType,
    margins: stableMargins,
    plot: { width: plotWidth, height: plotHeight },
    ready,
    xCenter,
    bandwidth,
    indexAtX,
    barSlot,
    y,
    bands,
    max,
    min,
    selectedDataKey,
    selectDataKey,
    focusDataKey,
    setFocusDataKey,
    hoverIndex,
    setHoverIndex,
    markerIndex,
    cursorX,
    setCursorX,
    isMouseInChart,
    setMouseInChart,
    hovered,
    bloom,
    bloomOnHover,
    seriesSpecs,
    registerSeries,
    unregisterSeries,
    animate,
    animationDuration,
    revision,
    entranceDone,
    markEntranceDone,
    seedOf,
    common,
  }), [
    chartType,
    config,
    configKeys,
    data,
    stackType,
    stableMargins,
    plotWidth,
    plotHeight,
    ready,
    xCenter,
    bandwidth,
    indexAtX,
    barSlot,
    y,
    bands,
    max,
    min,
    selectedDataKey,
    selectDataKey,
    focusDataKey,
    setFocusDataKey,
    hoverIndex,
    setHoverIndex,
    markerIndex,
    cursorX,
    setCursorX,
    isMouseInChart,
    setMouseInChart,
    hovered,
    bloom,
    bloomOnHover,
    seriesSpecs,
    registerSeries,
    unregisterSeries,
    animate,
    animationDuration,
    revision,
    entranceDone,
    markEntranceDone,
    seedOf,
    common,
  ]);
}
