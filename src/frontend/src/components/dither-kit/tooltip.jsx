"use client";
import { AnimatePresence, motion } from "motion/react"
import { useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useCommonChart } from "./common-context"
import { cn } from "./lib"
import { rgb } from "./palette"

const VARIANT = {
  default: "bg-popover",
  "frosted-glass": "bg-popover/70 backdrop-blur-sm",
}

export function Tooltip({
  labelKey,
  valueFormatter,
  variant = "default"
}) {
  const chart = useCommonChart()
  const show = chart.ready && chart.hoverIndex != null

  const [lastIndex, setLastIndex] = useState(0)
  if (chart.hoverIndex != null && chart.hoverIndex !== lastIndex) {
    setLastIndex(chart.hoverIndex)
  }
  const index = chart.hoverIndex ?? lastIndex

  const heading = chart.heading(index, labelKey)
  const items = chart.itemsAt(index)

  const anchorRef = useRef(null)
  const [origin, setOrigin] = useState({ x: 0, y: 0 })
  useLayoutEffect(() => {
    if (!show) return
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (rect) setOrigin({ x: rect.left, y: rect.top })
    }
    update()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [show])

  const top = origin.y + chart.tooltipTop
  const left = origin.x + chart.tooltipLeft

  const card = (
    <AnimatePresence>
      {show && items.length > 0 && (
        <motion.div
          key="dither-tooltip"
          initial={{
            opacity: 0,
            x: "-50%",
            y: "-115%",
            top,
            left,
          }}
          animate={{
            opacity: 1,
            x: "-50%",
            y: "-115%",
            top,
            left,
          }}
          exit={{ opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 520,
            damping: 38,
            mass: 0.6,
          }}
          className={cn(
            "pointer-events-none fixed z-50 rounded-md border px-2 py-1 shadow-sm",
            VARIANT[variant]
          )}
        >
          {heading && (
            <div className="mb-0.5 font-mono text-[10px] text-muted-foreground">
              {heading}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 font-mono text-[11px] text-popover-foreground tabular-nums"
                style={{ opacity: item.dimmed ? 0.4 : 1 }}
              >
                <span
                  className="size-2 rounded-[1px]"
                  style={{ backgroundColor: rgb(item.seed.fill) }}
                />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="ml-auto pl-2 text-foreground">
                  {valueFormatter
                    ? valueFormatter(item.value, item.name)
                    : item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <span ref={anchorRef} aria-hidden className="pointer-events-none absolute top-0 left-0 size-0" />
      {typeof document === "undefined" ? card : createPortal(card, document.body)}
    </>
  )
}

Tooltip.chartLayer = "dom"
