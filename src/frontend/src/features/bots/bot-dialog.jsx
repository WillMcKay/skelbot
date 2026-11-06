import { XIcon } from 'lucide-react'
import { DitherGradient } from '@/components/dither-kit/gradient'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogPopup, DialogTitle } from '@/components/ui/dialog'
import { navigate } from '@/hooks/use-hash-route'
import { cn } from '@/lib/utils'
import { BotHead } from './bot-head'

export const FULL_WIDTH = 'h-10 w-full rounded-xl text-sm'
export const DIALOG_BUTTON = 'h-10 rounded-xl px-5'

export function BotIdentity ({ name, detail }) {
  return (
    <div className='flex min-w-0 items-center gap-3'>
      <BotHead name={name} className='size-10 text-muted-foreground' />
      <div className='min-w-0 flex-1'>
        <DialogTitle className='truncate text-base'>{name}</DialogTitle>
        <p className='truncate text-muted-foreground text-sm'>{detail}</p>
      </div>
    </div>
  )
}

export function DialogStep ({ title, detail }) {
  return (
    <div className='min-w-0'>
      <DialogTitle className='text-base'>{title}</DialogTitle>
      {detail && <p className='text-muted-foreground text-sm'>{detail}</p>}
    </div>
  )
}

function StepSegment ({ state }) {
  return (
    <span className={cn('relative h-3 flex-1 overflow-hidden rounded-[3px]', state === 'next' ? 'bg-card ring-1 ring-foreground/15 ring-inset' : 'bg-primary-strong')}>
      {state === 'current' && <DitherGradient from='primary' direction='right' cell={2} />}
    </span>
  )
}

function StepProgress ({ step, steps }) {
  const states = Array.from({ length: steps }, (_, index) => {
    if (index + 1 < step) return 'done'
    return index + 1 === step ? 'current' : 'next'
  })

  return (
    <div
      role='progressbar'
      aria-label='Progress'
      aria-valuemin={1}
      aria-valuemax={steps}
      aria-valuenow={Math.min(step, steps)}
      className='flex flex-1 gap-1.5'
    >
      {states.map((state, index) => <StepSegment key={index} state={state} />)}
    </div>
  )
}

function ProgressHeader ({ step, steps }) {
  return (
    <div className='relative isolate flex h-16 shrink-0 items-center gap-3 overflow-hidden ps-6 pe-3'>
      <DitherGradient from='primary' direction='down' cell={3} opacity={0.4} className='-z-10' />
      <StepProgress step={step} steps={steps} />
      <DialogClose aria-label='Close' render={<Button size='icon' variant='ghost' />}>
        <XIcon />
      </DialogClose>
    </div>
  )
}

export function BotDialog ({ closeTo, step, steps, children }) {
  return (
    <Dialog open onOpenChange={open => !open && navigate(closeTo)}>
      <DialogPopup showCloseButton={false} className='max-w-lg gap-0 overflow-hidden rounded-2xl'>
        <ProgressHeader step={step} steps={steps} />
        <div className='min-h-0 overflow-y-auto'>{children}</div>
      </DialogPopup>
    </Dialog>
  )
}

export function FormError ({ children }) {
  return <p role='alert' className='text-destructive-foreground text-sm'>{children}</p>
}
