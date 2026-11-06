import { useCallback, useState } from 'react'

const toggled = (list, values, on) => (on ? [...new Set([...list, ...values])] : list.filter(v => !values.includes(v)))

export function useWebhookForm (initial) {
  const [hook, setHook] = useState(() => structuredClone(initial))

  const set = useCallback((key, value) => setHook(h => ({ ...h, [key]: value })), [])
  const setMention = useCallback((key, value) => setHook(h => ({ ...h, mention: { ...h.mention, [key]: value } })), [])
  const toggleEvents = useCallback((ids, on) => setHook(h => ({ ...h, events: toggled(h.events, ids, on) })), [])
  const toggleBot = useCallback((id, on) => setHook(h => ({ ...h, bots: toggled(h.bots === 'all' ? [] : h.bots, [id], on) })), [])

  return { hook, set, setMention, toggleEvents, toggleBot }
}
