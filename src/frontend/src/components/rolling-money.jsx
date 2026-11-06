import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { money } from '@/lib/format'

const ROLL_MS = 700
const ROLL_STEPS = 14

export function RollingMoney ({ value }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [shown, setShown] = useState(value)
  const latest = useRef(value)

  useEffect(() => {
    const from = latest.current
    if (reducedMotion || !Number.isFinite(value) || !Number.isFinite(from) || from === value) {
      latest.current = value
      setShown(value)
      return
    }

    const started = performance.now()
    let frame = requestAnimationFrame(function tick (now) {
      const progress = Math.ceil(Math.min((now - started) / ROLL_MS, 1) * ROLL_STEPS) / ROLL_STEPS
      latest.current = from + (value - from) * progress
      setShown(latest.current)
      if (progress < 1) frame = requestAnimationFrame(tick)
    })

    return () => cancelAnimationFrame(frame)
  }, [value, reducedMotion])

  return money(shown)
}
