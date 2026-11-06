import { useEffect, useState } from 'react'
import { ArrowUpRightIcon, CircleCheckIcon, CircleAlertIcon, CopyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { signInApi } from '@/lib/api'
import { toast } from '@/lib/toast'

const POLL_MS = 1500

export async function copyCode (code) {
  await navigator.clipboard?.writeText(code)
  toast.success('Code copied')
}

export const signInLink = ({ url, code }) => `${url}?otc=${encodeURIComponent(code)}`

export function useSignIn () {
  const [state, setState] = useState(null)
  const [starting, setStarting] = useState(false)
  const pending = state?.status === 'waiting' || state?.status === 'code'

  useEffect(() => {
    if (!pending) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const next = await signInApi.status(state.id)
        if (!cancelled) setState(next)
      } catch (err) {
        if (!cancelled) setState({ status: 'error', error: err.message })
      }
    }, POLL_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [state, pending])

  const start = async () => {
    setStarting(true)
    try {
      setState(await signInApi.start())
    } catch (err) {
      setState({ status: 'error', error: err.message })
    } finally {
      setStarting(false)
    }
  }

  return { state, pending, starting, done: state?.status === 'done', start, reset: () => setState(null) }
}

export function SignInBox ({ state }) {
  if (state.status === 'waiting') {
    return (
      <div className='flex items-center gap-2 rounded-xl border bg-muted/40 p-4 text-muted-foreground text-sm'>
        <Spinner className='size-4' />Getting a sign-in code…
      </div>
    )
  }

  if (state.status === 'code') {
    return (
      <div className='flex flex-col gap-3 rounded-xl border bg-muted/40 p-4'>
        <p className='font-medium text-sm'>Enter this code at Microsoft</p>
        <div className='flex items-center gap-2'>
          <code className='flex-1 rounded-lg bg-card px-3 py-2.5 text-center font-mono font-semibold text-xl tracking-[0.3em] shadow-sm'>{state.code}</code>
          <Button type='button' variant='outline' size='icon-lg' className='rounded-lg' onClick={() => copyCode(state.code)} aria-label='Copy code'><CopyIcon /></Button>
        </div>
        <Button variant='outline' className='h-9 rounded-lg' render={<a href={signInLink(state)} target='_blank' rel='noreferrer' />}>
          Open {state.url.replace(/^https?:\/\/(www\.)?/, '')}<ArrowUpRightIcon />
        </Button>
      </div>
    )
  }

  if (state.status === 'done') {
    return (
      <p role='status' className='flex items-center gap-2 rounded-xl bg-success px-4 py-3 text-sm text-success-foreground'>
        <CircleCheckIcon className='size-4.5' aria-hidden='true' />Signed in as <span className='font-semibold'>{state.username}</span>
      </p>
    )
  }

  return (
    <p role='alert' className='flex items-center gap-2 rounded-xl bg-error/60 px-4 py-3 text-error-foreground text-sm'>
      <CircleAlertIcon className='size-4.5 shrink-0' aria-hidden='true' />{state.error || 'Sign-in failed.'}
    </p>
  )
}
