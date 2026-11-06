import { useEffect } from "react"
import { useChartPart } from "./chart-context"

export function Line({ dataKey, variant = "solid" }) {
  const ctx = useChartPart("Line", "line")
  const { registerSeries, unregisterSeries } = ctx

  if (process.env.NODE_ENV !== "production" && !ctx.config[dataKey]) {
    console.warn(
      `<Line dataKey="${dataKey}" />: "${dataKey}" is not in the chart config. Add it so the series has a colour and label.`
    )
  }

  useEffect(() => {
    registerSeries({ dataKey, kind: "line", variant })
    return () => unregisterSeries(dataKey)
  }, [dataKey, variant, registerSeries, unregisterSeries])

  return null
}
