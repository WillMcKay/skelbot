import { Fragment } from 'react'
import { ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHero ({ icon: Icon, media, title, titleAction, description, crumbs = [], actions, headerActions }) {
  const hasHeaderActions = Boolean(headerActions)

  return (
    <header className={cn(
      'flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center',
      hasHeaderActions && 'rounded-3xl bg-card p-3 sm:p-4'
    )}
    >
      <div className='flex min-w-0 items-start gap-3'>
        {media}
        {Icon && (
          <span className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground',
            hasHeaderActions && 'size-10 bg-primary/5 text-foreground'
          )}
          >
            <Icon className='size-5' aria-hidden='true' />
          </span>
        )}
        <div className='flex min-w-0 flex-col gap-2'>
          <div className='flex min-w-0 items-center gap-2'>
            <h1 className={cn('truncate font-semibold tracking-tight', hasHeaderActions ? 'text-xl' : 'text-lg')}>{title}</h1>
            {titleAction}
          </div>
          {description && <p className='max-w-2xl text-muted-foreground text-sm'>{description}</p>}
          {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
        </div>
      </div>

      {(headerActions || crumbs.length > 0) && (
        <div className='flex w-full shrink-0 flex-col items-end gap-3 sm:w-auto'>
          {crumbs.length > 0 && (
            <nav aria-label='Breadcrumb' className='flex items-center gap-1 text-xs text-muted-foreground'>
              {crumbs.map((crumb, i) => (
                <Fragment key={crumb.label}>
                  {i > 0 && <ChevronRightIcon className='size-3 text-muted-foreground' aria-hidden='true' />}
                  {crumb.href
                    ? <a href={crumb.href} className='rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>{crumb.label}</a>
                    : <span className={cn(i === crumbs.length - 1 && 'font-medium')}>{crumb.label}</span>}
                </Fragment>
              ))}
            </nav>
          )}
          {headerActions && (
            <div className='flex w-full items-end sm:w-auto'>{headerActions}</div>
          )}
        </div>
      )}
    </header>
  )
}

export function Page ({ children }) {
  return <div className='mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 p-3 sm:p-5'>{children}</div>
}
