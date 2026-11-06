import { DitherGradient } from '@/components/dither-kit/gradient'
import { CardFrame } from '@/components/ui/card'
import { useReveal } from '@/hooks/use-reveal'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: { tile: 'gap-0.5 px-3 py-1.5', value: 'text-xl' },
  md: { tile: 'gap-2 p-3.5 sm:p-4', label: 'min-h-7', value: 'text-2xl' },
  lg: { tile: 'justify-center gap-1 px-3 py-1.5', value: 'text-[2rem] leading-none' }
}

export function StatTile ({ icon: Icon, label, value, hint, action, size = 'md', className, children }) {
  const reveal = useReveal()
  const styles = SIZES[size]

  return (
    <div ref={reveal} className={cn('relative isolate flex h-full min-w-0 flex-col overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]', styles.tile, className)}>
      <div className='pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2' aria-hidden='true'>
        <DitherGradient from='primary' direction='up' cell={3} opacity={0.06} />
      </div>
      <div className={cn('flex items-center justify-between gap-2', styles.label)}>
        <span className='flex items-center gap-1.5 text-[13px] text-muted-foreground'>
          {Icon && <Icon className='size-4.5' aria-hidden='true' />}
          {label}
        </span>
        {action}
      </div>
      <div className='flex min-w-0 items-end gap-4'>
        <span className={cn('shrink-0 whitespace-nowrap font-semibold tabular-nums tracking-tight', styles.value)}>{value}</span>
        {children && <div className='min-w-0 flex-1'>{children}</div>}
      </div>
      {hint && <span className='text-muted-foreground text-xs'>{hint}</span>}
    </div>
  )
}

export function StatGroup ({ children, alignTop = false, fill = false }) {
  return (
    <CardFrame className='rounded-2xl'>
      <div className={`relative grid gap-2 ${alignTop ? 'items-start' : ''} ${fill ? 'flex-1 grid-cols-2 grid-rows-[1fr_auto]' : 'grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]'}`}>{children}</div>
    </CardFrame>
  )
}
