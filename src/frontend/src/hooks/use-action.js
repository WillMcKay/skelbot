import { useCallback, useState } from 'react'
import { toast } from '@/lib/toast'

export function useAction () {
  const [pending, setPending] = useState(null)

  const run = useCallback(async (key, action, { success } = {}) => {
    setPending(key)
    try {
      const result = await action()
      if (success) toast.success(success)
      return result
    } catch (err) {
      toast.error(err.message)
      return undefined
    } finally {
      setPending(null)
    }
  }, [])

  return { pending, run }
}
