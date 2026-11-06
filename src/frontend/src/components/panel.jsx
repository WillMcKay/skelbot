import { DitherGradient } from '@/components/dither-kit/gradient'
import { Card, CardFrame, CardFrameAction, CardFrameDescription, CardFrameHeader, CardFrameTitle, CardPanel } from '@/components/ui/card'
import { useReveal } from '@/hooks/use-reveal'
import { cn } from '@/lib/utils'

export function Panel ({ title, description, action, flush = false, className, contentClassName, bodyClassName, children }) {
  const hasHeader = title || description || action
  const reveal = useReveal()

  return (
    <CardFrame ref={reveal} className={cn('isolate overflow-hidden rounded-2xl', className)}>
      {hasHeader && (
        <div className='pointer-events-none absolute inset-x-0 top-0 z-0 h-12' aria-hidden='true'>
          <DitherGradient from='primary' direction='down' cell={3} opacity={0.06} />
        </div>
      )}
      {hasHeader && (
        <CardFrameHeader className='min-h-9 px-3 pt-1.5'>
          {title && <CardFrameTitle className='text-[15px]'>{title}</CardFrameTitle>}
          {description && <CardFrameDescription>{description}</CardFrameDescription>}
          {action && <CardFrameAction>{action}</CardFrameAction>}
        </CardFrameHeader>
      )}
      <Card className={cn('rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]', contentClassName)}>
        <CardPanel className={cn(flush ? 'p-0' : 'p-4 sm:p-5', bodyClassName)}>{children}</CardPanel>
      </Card>
    </CardFrame>
  )
}

export function Chip ({ className, children }) {
  return (
    <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full bg-card px-3 font-medium text-[13px] shadow-[0_1px_2px_rgb(0_0_0/0.06)]', className)}>
      {children}
    </span>
  )
}
