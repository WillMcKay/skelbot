import { createContext, useCallback, useContext, useState } from 'react'
import { readStored, writeStored } from '@/lib/storage'

const KEY = 'skelbot:anonymous'
const AnonymousContext = createContext(null)

export function AnonymousProvider ({ children }) {
  const [anonymous, setState] = useState(() => readStored(KEY) === '1')

  const setAnonymous = useCallback(on => {
    setState(on)
    writeStored(KEY, on ? '1' : '0')
  }, [])

  return <AnonymousContext.Provider value={{ anonymous, setAnonymous }}>{children}</AnonymousContext.Provider>
}

export function useAnonymous () {
  const value = useContext(AnonymousContext)
  if (!value) throw new Error('useAnonymous must be used inside AnonymousProvider')
  return value
}
