import { useEffect, useState } from 'react'

const read = () => window.location.hash.replace(/^#\/?/, '')

export function useHashRoute () {
  const [path, setPath] = useState(read)

  useEffect(() => {
    const onChange = () => setPath(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return path
}

export function navigate (path) {
  window.location.hash = path ? `/${path}` : ''
}
