import { useEffect, useRef } from "react"
import { useChart } from "./chart-context"
import { backingSize, bloomLayerStyle, paintColumn, resample } from "./dither-paint"

export function LineCanvas() {
  const ctx = useChart()
  const canvasRef = useRef(null)
  const bloomRef = useRef(null)
  const { width, height } = ctx.plot
  const { cols, rows } = backingSize(width, height)

  useEffect(() => {
    const canvas = canvasRef.current
    const c = canvas?.getContext("2d")
    const bloomCanvas = bloomRef.current
    const bloomCtx = bloomCanvas?.getContext("2d")
    if (!canvas || !c || !bloomCanvas || !bloomCtx || !ctx.ready || cols <= 0 || rows <= 0) return

    canvas.width = cols
    canvas.height = rows
    bloomCanvas.width = cols
    bloomCanvas.height = rows
    c.clearRect(0, 0, cols, rows)
    bloomCtx.clearRect(0, 0, cols, rows)

    for (const dataKey of ctx.configKeys) {
      if (ctx.seriesSpecs[dataKey]?.kind !== "line") continue

      const band = ctx.bands[dataKey]
      if (!band?.length) continue

      const seed = ctx.seedOf(dataKey)
      const values = resample(
        band.map(point => (ctx.y(point[1]) / height) * (rows - 1)),
        cols
      )
      const emphasis = ctx.selectedDataKey ?? ctx.focusDataKey
      const dim = emphasis !== null && emphasis !== dataKey ? 0.3 : 1

      values.forEach((value, x) => {
        paintColumn(c, x, value, rows - 1, seed, {
          variant: "gradient",
          intensity: 0,
          dim,
          stacked: false
        })
        paintColumn(c, x, value, value, seed, {
          variant: "solid",
          intensity: 0,
          dim,
          stacked: false
        })
        paintColumn(bloomCtx, x, value, value, seed, {
          variant: "solid",
          intensity: 0,
          dim,
          stacked: false
        })
      })
    }
  }, [ctx, cols, rows, width, height])

  const bloom = bloomLayerStyle(ctx.bloom, ctx.bloom !== "off")
  const pos = {
    left: ctx.margins.left,
    top: ctx.margins.top,
    width,
    height
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute"
        style={{ ...pos, imageRendering: "pixelated" }}
        aria-hidden="true"
      />
      <canvas
        ref={bloomRef}
        className="pointer-events-none absolute"
        style={{ ...pos, transition: "opacity 220ms ease", ...(bloom ?? { opacity: 0 }) }}
        aria-hidden="true"
      />
    </>
  )
}
