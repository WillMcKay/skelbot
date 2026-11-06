import { toast } from '@/lib/toast'
import { navigate } from '@/hooks/use-hash-route'
import { useLiveData, useNotifications } from '@/hooks/use-live-data'

const TOASTED_LEVELS = new Set(['alert', 'error', 'warning'])
const TOASTED_EVENTS = new Set(['cycle-finished'])

function chime () {
  try {
    const ctx = new AudioContext()
    for (const [i, freq] of [880, 660].entries()) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = ctx.currentTime + i * 0.18
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.17)
    }
    setTimeout(() => ctx.close(), 600)
  } catch {}
}

function desktopNotification (title, body, tag) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !document.hidden) return
  new Notification(title, { body, tag })
}

function showToast (id, title, notification) {
  const options = {
    description: notification.description,
    actionProps: { children: 'View', onClick: () => navigate(`bots/${id}`) }
  }

  if (notification.level === 'alert') return toast.error(title, { ...options, timeout: 15000 })
  if (notification.level === 'error') return toast.error(title, options)
  if (notification.level === 'warning') return toast.warning(title, options)
  return toast.success(title, options)
}

export function useAlerts () {
  const { bots } = useLiveData()

  useNotifications(({ id, notification }) => {
    if (!TOASTED_LEVELS.has(notification.level) && !TOASTED_EVENTS.has(notification.event)) return

    const title = `${bots[id]?.name ?? 'skelbot'}: ${notification.title}`
    showToast(id, title, notification)

    if (notification.level === 'alert') {
      chime()
      desktopNotification(title, notification.description, `${id}-${notification.event}`)
    }
  })
}
