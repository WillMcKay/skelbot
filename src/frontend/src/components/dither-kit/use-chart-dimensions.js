import { useLayoutEffect, useRef, useState } from "react"

export function useChartDimensions() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const width = Math.max(0, el.clientWidth)
      const height = Math.max(0, el.clientHeight)
      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height }
      )
    }

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  return { ref, size }
}
