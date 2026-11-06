"use client";
import { createContext, use, useCallback, useMemo, useState } from "react"
import { useRevision } from "./chart-context";
import { seedOfColor } from "./palette"
import { pieSlices, radarAxes } from "./polar";

const ROOT_OF = {
  pie: "<PieChart />",
  radar: "<RadarChart />",
}

const PolarChartContext = createContext(null)

export function usePolarChart() {
  const ctx = use(PolarChartContext)
  if (!ctx) {
    throw new Error("Polar chart parts must be used within a polar chart root.")
  }
  return ctx
}

export function usePolarPart(part, kind) {
  const ctx = use(PolarChartContext)
  if (!ctx) {
    throw new Error(`<${part} /> must be used within ${ROOT_OF[kind]}.`)
  }
  if (ctx.chartType !== kind) {
    throw new Error(
      `<${part} /> is not valid inside ${ROOT_OF[ctx.chartType]} — it belongs in ${ROOT_OF[kind]}.`
    )
  }
  return ctx
}

export { PolarChartContext }

export function usePolarController(
  {
    chartType,
    data,
    config,
    dataKey,
    nameKey,
    innerRadiusRatio,
    dimensions,
    margins,
    animate = true,
    animationDuration = 900,
    replayToken = 0,
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
  const [cursorY, setCursorY] = useState(0)
  const [isMouseInChart, setMouseInChart] = useState(false)
  const setCursor = useCallback((px, py) => {
    setCursorX(px)
    setCursorY(py)
  }, [])
  const [variants, setVariants] = useState({})

  const registerVariant = useCallback((key, variant) => {
    setVariants((prev) =>
      prev[key] === variant ? prev : { ...prev, [key]: variant }
    )
  }, [])
  const unregisterVariant = useCallback((key) => {
    setVariants((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
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
  const pad = chartType === "radar" ? 20 : 6
  const outerRadius = Math.max(0, Math.min(plotWidth, plotHeight) / 2 - pad)
  const innerRadius = chartType === "pie" ? outerRadius * innerRadiusRatio : 0
  const centerX = plotWidth / 2
  const centerY = plotHeight / 2

  const seedOf = useCallback(
    (key) => seedOfColor(config[key]?.color ?? "grey"),
    [config]
  )
  const variantOf = useCallback(
    (key) => variants[key] ?? variants["*"] ?? "gradient",
    [variants]
  )

  const pie = useMemo(
    () => (chartType === "pie" ? pieSlices(data, dataKey, nameKey) : null),
    [chartType, data, dataKey, nameKey]
  )

  const radar = useMemo(() => {
    if (chartType !== "radar") return null
    let max = 0
    for (const row of data) {
      for (const key of configKeys) {
        const v = Number(row[key]) || 0
        if (v > max) max = v
      }
    }
    return { axes: radarAxes(data, nameKey), max: max || 1 }
  }, [chartType, data, configKeys, nameKey])

  const common = useMemo(() => {
    const tooltipLeft = Math.max(48, Math.min(plotWidth + mLeft - 48, cursorX))
    const tooltipTop = Math.max(mTop, cursorY)
    const emphasis = selectedDataKey ?? focusDataKey
    if (chartType === "pie" && pie) {
      const names = pie.map((s) => s.name)
      return {
        names,
        tooltipTop,
        labelOf: (n) => config[n]?.label ?? n,
        seedOf,
        selectedDataKey,
        selectDataKey,
        focusDataKey,
        setFocusDataKey,
        hoverIndex,
        ready,
        tooltipLeft,
        heading: (i) => pie[i]?.name ?? null,
        itemsAt: (i) => {
          const s = pie[i]
          if (!s) return []
          return [
            {
              name: s.name,
              label: config[s.name]?.label ?? s.name,
              value: s.value,
              seed: seedOf(s.name),
              dimmed: emphasis !== null && emphasis !== s.name,
            },
          ]
        },
      }
    }
    return {
      names: configKeys,
      tooltipTop,
      labelOf: (n) => config[n]?.label ?? n,
      seedOf,
      selectedDataKey,
      selectDataKey,
      focusDataKey,
      setFocusDataKey,
      hoverIndex,
      ready,
      tooltipLeft,
      heading: (i) => radar?.axes[i]?.label ?? null,
      itemsAt: (i) =>
        configKeys.map((name) => {
          const raw = data[i]?.[name]
          return {
            name,
            label: config[name]?.label ?? name,
            value: typeof raw === "number" ? raw : 0,
            seed: seedOf(name),
            dimmed: emphasis !== null && emphasis !== name,
          }
        }),
    }
  }, [
    chartType,
    config,
    configKeys,
    data,
    pie,
    radar,
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
    cursorY,
  ])

  return useMemo(() => ({
    chartType,
    config,
    configKeys,
    data,
    dataLength: data.length,
    ready,
    plot: { width: plotWidth, height: plotHeight },
    margins: stableMargins,
    center: { x: centerX, y: centerY },
    outerRadius,
    innerRadius,
    animate,
    animationDuration,
    revision,
    bloom,
    bloomOnHover,
    seedOf,
    variantOf,
    registerVariant,
    unregisterVariant,
    selectedDataKey,
    selectDataKey,
    focusDataKey,
    setFocusDataKey,
    hoverIndex,
    setHoverIndex,
    setCursor,
    isMouseInChart,
    setMouseInChart,
    pie,
    radar,
    common,
  }), [
    chartType,
    config,
    configKeys,
    data,
    ready,
    plotWidth,
    plotHeight,
    stableMargins,
    centerX,
    centerY,
    outerRadius,
    innerRadius,
    animate,
    animationDuration,
    revision,
    bloom,
    bloomOnHover,
    seedOf,
    variantOf,
    registerVariant,
    unregisterVariant,
    selectedDataKey,
    selectDataKey,
    focusDataKey,
    setFocusDataKey,
    hoverIndex,
    setHoverIndex,
    setCursor,
    isMouseInChart,
    setMouseInChart,
    pie,
    radar,
    common,
  ]);
}
