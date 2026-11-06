import { useLayoutEffect, useRef } from 'react'

const STAGGER_MS = 20
const MAX_STAGGER_MS = 120

const observer = new IntersectionObserver(entries => {
  entries.filter(entry => entry.isIntersecting).forEach(({ target }, index) => {
    observer.unobserve(target)
    target.style.setProperty('--reveal-delay', `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms`)
    target.dataset.reveal = 'showing'
  })
})

export function useReveal () {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const card = ref.current
    card.dataset.reveal = 'waiting'
    observer.observe(card)
    return () => observer.unobserve(card)
  }, [])

  return ref
}
