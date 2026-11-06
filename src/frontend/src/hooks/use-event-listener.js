'use client';
import { useRef, useEffect } from 'react';
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect'

export function useEventListener(
  eventName,
  handler,
  element,
  options,
) {
  const savedHandler = useRef(handler)

  useIsomorphicLayoutEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    const targetElement = element?.current ?? element ?? (typeof window !== 'undefined' ? window : null)

    if (!targetElement?.addEventListener) return

    const eventListener = (event) => savedHandler.current(event)

    targetElement.addEventListener(eventName, eventListener, options)

    return () => {
      targetElement.removeEventListener(eventName, eventListener, options)
    }
  }, [eventName, element, options])
}
