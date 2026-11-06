'use client'

import * as React from 'react'

function subscribe(callback, query) {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia(query)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

export function useMediaQuery(query, serverFallback = false) {
  return React.useSyncExternalStore(
    React.useCallback((callback) => subscribe(callback, query), [query]),
    () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : serverFallback),
    () => serverFallback,
  )
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)', false)
}
