import { useEffect, useRef, useState } from 'react'
import steveBody from '@/assets/steve-body.png'
import steveHead from '@/assets/steve-head.png'
import { useAnonymous } from '@/hooks/use-anonymous'
import { cn } from '@/lib/utils'

const HEAD_PIXELS = 64
const BODY_PIXELS = 16

const CHIBI_WIDTH = 14
const CHIBI_HEIGHT = 20

const CHIBI_PARTS = [
  [[0, 8, 4, 12], [1, 8, 2, 6]],
  [[12, 8, 4, 12], [11, 8, 2, 6]],
  [[4, 20, 4, 12], [3, 14, 4, 6]],
  [[8, 20, 4, 12], [7, 14, 4, 6]],
  [[4, 8, 8, 12], [3, 8, 8, 6]],
  [[4, 0, 8, 8], [3, 0, 8, 8]]
]

function useSkin (name, render, size, steve) {
  const { anonymous } = useAnonymous()
  const [failedName, setFailedName] = useState(null)
  const useSteve = anonymous || !name || failedName === name

  return {
    src: useSteve ? steve : `https://mc-heads.net/${render}/${encodeURIComponent(name)}/${size}`,
    onError: () => { if (!useSteve) setFailedName(name) }
  }
}

export function BotHead ({ name, className }) {
  const { src, onError } = useSkin(name, 'avatar', HEAD_PIXELS, steveHead)

  return (
    <img
      src={src}
      alt=''
      loading='lazy'
      referrerPolicy='no-referrer'
      draggable={false}
      onError={onError}
      className={cn('shrink-0 rounded-[3px] [image-rendering:pixelated]', className)}
    />
  )
}

export function BotChibi ({ name, className }) {
  const canvasRef = useRef(null)
  const { src, onError } = useSkin(name, 'player', BODY_PIXELS, steveBody)

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d')
    const image = new Image()

    image.referrerPolicy = 'no-referrer'
    image.onerror = onError
    image.onload = () => {
      ctx.clearRect(0, 0, CHIBI_WIDTH, CHIBI_HEIGHT)
      ctx.imageSmoothingEnabled = false
      for (const [from, to] of CHIBI_PARTS) ctx.drawImage(image, ...from, ...to)
    }
    image.src = src

    return () => {
      image.onload = null
      image.onerror = null
    }
  }, [src])

  return <canvas ref={canvasRef} width={CHIBI_WIDTH} height={CHIBI_HEIGHT} aria-hidden='true' className={cn('[image-rendering:pixelated]', className)} />
}
