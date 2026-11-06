import { toastManager } from '@/components/ui/toast'

const TIMEOUTS = { success: 4000, info: 5000, warning: 7000, error: 8000 }

const show = type => (title, options = {}) => toastManager.add({ type, title, timeout: TIMEOUTS[type], ...options })

export const toast = {
  info: show('info'),
  success: show('success'),
  warning: show('warning'),
  error: show('error')
}

export function toastUncaughtErrors () {
  const report = error => {
    const description = error?.message ?? String(error)
    toast.error('Something went wrong', { id: `uncaught:${description}`, description })
  }

  window.addEventListener('error', event => event.error && report(event.error))
  window.addEventListener('unhandledrejection', event => report(event.reason))
}
