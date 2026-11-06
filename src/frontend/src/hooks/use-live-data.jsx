import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { useAnonymous } from '@/hooks/use-anonymous'
import { anonymizeBots, anonymizeNotification } from '@/lib/anonymize'
import { eventsUrl } from '@/lib/api'

const LOG_LINES = 500
const NOTIFICATIONS = 100

const initialState = { loaded: false, connected: true, bots: {}, webhooks: [], proxies: { entries: [], required: false }, modules: [], versions: { supported: [], recommended: null }, commit: null, events: [] }

function append (list, item, limit) {
  const next = [...list, item]
  return next.length > limit ? next.slice(-limit) : next
}

function updateBot (state, id, change) {
  const bot = state.bots[id]
  return bot ? { ...state, bots: { ...state.bots, [id]: change(bot) } } : state
}

function reducer (state, action) {
  switch (action.type) {
    case 'snapshot':
      return {
        loaded: true,
        connected: true,
        bots: Object.fromEntries(action.bots.map(bot => [bot.id, bot])),
        webhooks: action.webhooks,
        proxies: action.proxies,
        modules: action.modules,
        versions: action.versions,
        commit: action.commit,
        events: action.events
      }
    case 'disconnected':
      return { ...state, connected: false }
    case 'bot': {
      const old = state.bots[action.bot.id] ?? { logs: [], notifications: [] }
      return {
        ...state,
        bots: {
          ...state.bots,
          [action.bot.id]: {
            ...old,
            ...action.bot,
            uptime: { ...old.uptime, ...action.bot.uptime }
          }
        }
      }
    }
    case 'uptime':
      return updateBot(state, action.id, bot => ({ ...bot, uptime: { ...bot.uptime, ...action.uptime } }))
    case 'removed': {
      const { [action.id]: _removed, ...bots } = state.bots
      return { ...state, bots }
    }
    case 'log':
      return updateBot(state, action.id, bot => ({ ...bot, logs: append(bot.logs, action.entry, LOG_LINES) }))
    case 'logs-cleared':
      return updateBot(state, action.id, bot => ({ ...bot, logs: [] }))
    case 'notification':
      return updateBot(state, action.id, bot => ({ ...bot, notifications: append(bot.notifications, action.notification, NOTIFICATIONS) }))
    case 'webhooks':
      return { ...state, webhooks: action.webhooks }
    case 'proxies':
      return { ...state, proxies: action.proxies }
    default:
      return state
  }
}

const LiveDataContext = createContext(null)

export function LiveDataProvider ({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const listeners = useRef(new Set())
  const { anonymous } = useAnonymous()
  const redactRef = useRef(null)

  useEffect(() => {
    const source = new EventSource(eventsUrl)
    const on = (name, handle) => source.addEventListener(name, e => handle(JSON.parse(e.data)))

    on('snapshot', data => dispatch({ type: 'snapshot', ...data }))
    on('bot', bot => dispatch({ type: 'bot', bot }))
    on('uptime', ({ id, uptime }) => dispatch({ type: 'uptime', id, uptime }))
    on('removed', ({ id }) => dispatch({ type: 'removed', id }))
    on('log', ({ id, ...entry }) => dispatch({ type: 'log', id, entry }))
    on('logs-cleared', ({ id }) => dispatch({ type: 'logs-cleared', id }))
    on('webhooks', ({ webhooks }) => dispatch({ type: 'webhooks', webhooks }))
    on('proxies', proxies => dispatch({ type: 'proxies', proxies }))
    on('notification', event => {
      dispatch({ type: 'notification', ...event })
      const redact = redactRef.current
      const shown = redact ? { ...event, notification: anonymizeNotification(event.notification, redact) } : event
      for (const listener of listeners.current) listener(shown)
    })
    source.onerror = () => dispatch({ type: 'disconnected' })

    return () => source.close()
  }, [])

  const subscribe = useCallback(listener => {
    listeners.current.add(listener)
    return () => listeners.current.delete(listener)
  }, [])

  const value = useMemo(() => {
    const rawList = Object.values(state.bots)
    if (!anonymous) return { ...state, botList: rawList, rawBots: state.bots, subscribe }

    const { list, redact } = anonymizeBots(rawList)
    return { ...state, bots: Object.fromEntries(list.map(bot => [bot.id, bot])), botList: list, rawBots: state.bots, subscribe, redact }
  }, [state, subscribe, anonymous])
  redactRef.current = value.redact ?? null

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>
}

export function useLiveData () {
  const value = useContext(LiveDataContext)
  if (!value) throw new Error('useLiveData must be used inside LiveDataProvider')
  return value
}

export function useNotifications (handle) {
  const { subscribe } = useLiveData()
  const latest = useRef(handle)
  latest.current = handle

  useEffect(() => subscribe(event => latest.current(event)), [subscribe])
}
