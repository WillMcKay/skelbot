import { useEffect, useRef } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useReveal } from '@/hooks/use-reveal'
import { cn } from '@/lib/utils'

const FRAME_MS = 1000 / 30

export function SceneCanvas ({ scene, className }) {
  const canvasRef = useRef(null)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: Boolean(scene.transparent) })
    const draw = scene.create()
    const drawAt = now => draw(ctx, (now % scene.loopMs) / scene.loopMs)

    if (reducedMotion) {
      draw(ctx, scene.stillFrame)
      return
    }

    let frame = null
    let lastDrawn = performance.now()

    const tick = now => {
      frame = requestAnimationFrame(tick)
      if (now - lastDrawn < (scene.frameMs ?? FRAME_MS)) return
      lastDrawn = now
      drawAt(now)
    }

    drawAt(lastDrawn)

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && frame === null) {
        frame = requestAnimationFrame(tick)
      } else if (!entry.isIntersecting && frame !== null) {
        cancelAnimationFrame(frame)
        frame = null
      }
    })
    observer.observe(canvas)

    return () => {
      observer.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [scene, reducedMotion])

  return <canvas ref={canvasRef} width={scene.width} height={scene.height} aria-hidden='true' className={className} />
}

function SceneStage ({ scene, className, children }) {
  const stageWidth = `max(100cqw, calc(100cqh * ${scene.width / scene.height}))`

  return (
    <div className={cn('absolute inset-0 overflow-hidden [container-type:size]', className)}>
      <div className='absolute bottom-0 left-1/2 -translate-x-1/2' style={{ '--stage-width': stageWidth, width: 'var(--stage-width)', aspectRatio: `${scene.width} / ${scene.height}` }}>
        {children}
      </div>
    </div>
  )
}

export function SceneBanner ({ scene, compact = false, className, overlay, children }) {
  const reveal = useReveal()

  return (
    <div ref={reveal} className={cn('relative isolate min-h-32 w-full overflow-hidden rounded-3xl', compact ? 'sm:min-h-44' : 'aspect-[1920/380]', className)} style={{ backgroundColor: scene.color }}>
      <SceneStage scene={scene}>
        <SceneCanvas scene={scene} className='block size-full' />
      </SceneStage>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(90deg,rgb(30_22_64/75%),transparent_34%,transparent_80%,rgb(30_22_64/65%))] [mask-image:linear-gradient(black_40%,transparent)]' aria-hidden='true' />
      <div className='dark relative text-foreground'>
        <div className='p-3 [--muted-foreground:rgb(255_255_255/85%)] [--muted:rgb(20_12_40/45%)] sm:p-4'>
          {children}
        </div>
      </div>
      {overlay && <SceneStage scene={scene} className='pointer-events-none'>{overlay}</SceneStage>}
    </div>
  )
}
