import { Toast } from '@base-ui/react/toast'
import { CircleCheckIcon, InfoIcon, CircleAlertIcon, LoaderCircleIcon, TriangleAlertIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const TOAST_TONES = {
  error: { badge: 'bg-error text-error-foreground', bar: 'bg-error-foreground/50' },
  info: { badge: 'bg-info text-info-foreground', bar: 'bg-info-foreground/50' },
  loading: { badge: 'bg-muted text-muted-foreground', bar: 'bg-muted-foreground/40' },
  success: { badge: 'bg-success text-success-foreground', bar: 'bg-success-foreground/50' },
  warning: { badge: 'bg-warning text-warning-foreground', bar: 'bg-warning-foreground/50' }
}

const TOAST_ICONS = {
  error: CircleAlertIcon,
  info: InfoIcon,
  loading: LoaderCircleIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon
}

function getSwipeDirection(position) {
  const verticalDirection = position.startsWith('top') ? 'up' : 'down'

  if (position.includes('center')) {
    return [verticalDirection]
  }

  if (position.includes('left')) {
    return ['left', verticalDirection]
  }

  return ['right', verticalDirection]
}

function upsertReplayClassName(toast) {
  const k = toast.updateKey ?? 0
  if (k <= 0) return undefined
  const isEven = k % 2 === 0
  if (toast.type === 'error') {
    return isEven ? 'animate-toast-error-even' : 'animate-toast-error-odd'
  }
  return isEven ? 'animate-toast-success-even' : 'animate-toast-success-odd'
}

function Toasts(
  {
    position,
    portalProps
  }
) {
  const { toasts } = Toast.useToastManager()
  const swipeDirection = getSwipeDirection(position)

  return (
    <Toast.Portal data-slot="toast-portal" {...portalProps}>
      <Toast.Viewport
        className={cn(
          'fixed z-60 mx-auto flex w-[calc(100%-var(--toast-inset)*2)] max-w-90 [--toast-inset:--spacing(4)] sm:[--toast-inset:--spacing(8)]',
          'data-[position*=top]:top-(--toast-inset)',
          'data-[position*=bottom]:bottom-(--toast-inset)',
          'data-[position*=left]:left-(--toast-inset)',
          'data-[position*=right]:right-(--toast-inset)',
          'data-[position*=center]:left-1/2 data-[position*=center]:-translate-x-1/2',
        )}
        data-position={position}
        data-slot="toast-viewport"
      >
        {toasts.map((toast) => {
          const Icon = toast.type ? TOAST_ICONS[toast.type] : null
          const tone = TOAST_TONES[toast.type] ?? TOAST_TONES.info
          const toastData = toast.data

          return (
            <Toast.Root
              key={toast.id}
              className={cn(
                'absolute z-[calc(9999-var(--toast-index))] h-(--toast-calc-height) w-full select-none rounded-2xl border shadow-lg shadow-black/5 bg-[color-mix(in_srgb,var(--popover),var(--color-black)_calc(1%*max(0,var(--toast-index,0))))] not-dark:bg-clip-padding text-popover-foreground [transition:transform_.5s_cubic-bezier(.22,1,.36,1),opacity_.5s,height_.15s,background-color_.5s] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] data-expanded:bg-popover dark:bg-[color-mix(in_srgb,var(--popover),var(--color-black)_calc(6%*max(0,var(--toast-index,0))))] dark:data-expanded:bg-popover ',
                'data-[position*=right]:right-0 data-[position*=right]:left-auto',
                'data-[position*=left]:right-auto data-[position*=left]:left-0',
                'data-[position*=center]:right-0 data-[position*=center]:left-0',
                'data-[position*=top]:top-0 data-[position*=top]:bottom-auto data-[position*=top]:origin-[50%_calc(50%-50%*min(var(--toast-index,0),1))]',
                'data-[position*=bottom]:top-auto data-[position*=bottom]:bottom-0 data-[position*=bottom]:origin-[50%_calc(50%+50%*min(var(--toast-index,0),1))]',
                'after:absolute after:left-0 after:h-[calc(var(--toast-gap)+1px)] after:w-full',
                'data-[position*=top]:after:top-full',
                'data-[position*=bottom]:after:bottom-full',
                '[--toast-calc-height:var(--toast-frontmost-height,var(--toast-height))] [--toast-gap:--spacing(3)] [--toast-peek:--spacing(3)] [--toast-scale:calc(max(0,1-(var(--toast-index)*.1)))] [--toast-shrink:calc(1-var(--toast-scale))]',
                'data-[position*=top]:[--toast-calc-offset-y:calc(var(--toast-offset-y)+var(--toast-index)*var(--toast-gap)+var(--toast-swipe-movement-y))]',
                'data-[position*=bottom]:[--toast-calc-offset-y:calc(var(--toast-offset-y)*-1+var(--toast-index)*var(--toast-gap)*-1+var(--toast-swipe-movement-y))]',
                'data-[position*=top]:transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--toast-peek))+(var(--toast-shrink)*var(--toast-calc-height))))_scale(var(--toast-scale))]',
                'data-[position*=bottom]:transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--toast-peek))-(var(--toast-shrink)*var(--toast-calc-height))))_scale(var(--toast-scale))]',
                'data-limited:opacity-0',
                'data-expanded:h-(--toast-height)',
                'data-position:data-expanded:transform-[translateX(var(--toast-swipe-movement-x))_translateY(var(--toast-calc-offset-y))]',
                'data-[position*=top]:data-starting-style:transform-[translateY(calc(-100%-var(--toast-inset)))]',
                'data-[position*=bottom]:data-starting-style:transform-[translateY(calc(100%+var(--toast-inset)))]',
                'data-ending-style:opacity-0',
                'data-[position*=top]:data-ending-style:not-data-limited:not-data-swipe-direction:transform-[translateY(calc(-100%-var(--toast-inset)))]',
                'data-[position*=bottom]:data-ending-style:not-data-limited:not-data-swipe-direction:transform-[translateY(calc(100%+var(--toast-inset)))]',
                'data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-100%-var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]',
                'data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+100%+var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]',
                'data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-100%-var(--toast-inset)))]',
                'data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+100%+var(--toast-inset)))]',
                'data-expanded:data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-100%-var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]',
                'data-expanded:data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+100%+var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]',
                'data-expanded:data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-100%-var(--toast-inset)))]',
                'data-expanded:data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+100%+var(--toast-inset)))]',
                upsertReplayClassName(toast),
              )}
              {...toastData?.rootProps}
              data-position={position}
              swipeDirection={swipeDirection}
              toast={toast}
            >
              <Toast.Content className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-[inherit] p-3.5 pe-10 text-sm transition-opacity duration-250 data-behind:not-data-expanded:pointer-events-none data-behind:opacity-0 data-expanded:opacity-100">
                {Icon && (
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', tone.badge)} data-slot="toast-icon" aria-hidden="true">
                    <Icon className="size-4 in-data-[type=loading]:animate-spin" />
                  </span>
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1.5">
                  <Toast.Title className="font-medium leading-tight" data-slot="toast-title" />
                  <Toast.Description className="line-clamp-2 text-muted-foreground text-xs leading-snug" data-slot="toast-description" />
                  {toast.actionProps && (
                    <Toast.Action className={cn(buttonVariants({ size: 'xs', variant: 'outline' }), 'mt-2 self-start rounded-full')} data-slot="toast-action">
                      {toast.actionProps.children}
                    </Toast.Action>
                  )}
                </div>

                <Toast.Close
                  className="absolute end-2 top-2 grid size-7 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Dismiss"
                  data-slot="toast-close"
                >
                  <XIcon className="size-3.5" />
                </Toast.Close>

                {toast.timeout > 0 && (
                  <span
                    className={cn('absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[toast-countdown_linear_forwards] in-data-expanded:[animation-play-state:paused]', tone.bar)}
                    style={{ animationDuration: `${toast.timeout}ms` }}
                    aria-hidden="true"
                  />
                )}
              </Toast.Content>
            </Toast.Root>
          )
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function AnchoredToasts(
  {
    portalProps
  }
) {
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Portal data-slot="toast-portal-anchored" {...portalProps}>
      <Toast.Viewport className="outline-none" data-slot="toast-viewport-anchored">
        {toasts.map((toast) => {
          const Icon = toast.type ? TOAST_ICONS[toast.type] : null
          const toastData = toast.data
          const tooltipStyle = toastData?.tooltipStyle ?? false
          const positionerProps = toast.positionerProps

          if (!positionerProps?.anchor) {
            return null
          }

          return (
            <Toast.Positioner
              key={toast.id}
              className="z-50 max-w-[min(--spacing(64),var(--available-width))]"
              data-slot="toast-positioner"
              sideOffset={positionerProps.sideOffset ?? 4}
              toast={toast}
            >
              <Toast.Root
                className={cn(
                  'relative text-balance border bg-popover not-dark:bg-clip-padding text-popover-foreground text-xs transition-[scale,opacity] before:pointer-events-none before:absolute before:inset-0 data-ending-style:scale-98 data-starting-style:scale-98 data-ending-style:opacity-0 data-starting-style:opacity-0 ',
                  tooltipStyle
                    ? 'rounded-lg before:rounded-[calc(var(--radius-lg)-1px)]'
                    : 'rounded-xl before:rounded-[calc(var(--radius-xl)-1px)]',
                  upsertReplayClassName(toast),
                )}
                {...toastData?.rootProps}
                data-slot="toast-popup"
                toast={toast}
              >
                {tooltipStyle ? (
                  <Toast.Content className="pointer-events-auto px-2 py-1">
                    <Toast.Title data-slot="toast-title" />
                  </Toast.Content>
                ) : (
                  <Toast.Content className="pointer-events-auto flex items-center justify-between gap-1.5 overflow-hidden px-3.5 py-3 text-sm">
                    <div className="flex gap-2">
                      {Icon && (
                        <div
                          className="[&>svg]:h-lh [&>svg]:w-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
                          data-slot="toast-icon"
                        >
                          <Icon className="in-data-[type=loading]:animate-spin in-data-[type=error]:text-destructive in-data-[type=info]:text-info in-data-[type=success]:text-success in-data-[type=warning]:text-warning in-data-[type=loading]:opacity-80" />
                        </div>
                      )}

                      <div className="flex flex-col gap-0.5">
                        <Toast.Title className="font-medium" data-slot="toast-title" />
                        <Toast.Description className="text-muted-foreground" data-slot="toast-description" />
                      </div>
                    </div>
                    {toast.actionProps && (
                      <Toast.Action className={buttonVariants({ size: 'xs' })} data-slot="toast-action">
                        {toast.actionProps.children}
                      </Toast.Action>
                    )}
                  </Toast.Content>
                )}
              </Toast.Root>
            </Toast.Positioner>
          )
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export const toastManager = Toast.createToastManager()

export const anchoredToastManager = Toast.createToastManager()

export function ToastProvider(
  {
    children,
    position = 'bottom-right',
    portalProps,
    ...props
  }
) {
  return (
    <Toast.Provider toastManager={toastManager} {...props}>
      {children}
      <Toasts portalProps={portalProps} position={position} />
    </Toast.Provider>
  )
}

export function AnchoredToastProvider(
  {
    children,
    portalProps,
    ...props
  }
) {
  return (
    <Toast.Provider toastManager={anchoredToastManager} {...props}>
      {children}
      <AnchoredToasts portalProps={portalProps} />
    </Toast.Provider>
  )
}

export { Toast as ToastPrimitive }
