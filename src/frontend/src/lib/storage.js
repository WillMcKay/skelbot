export function readStored (key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStored (key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {}
}
