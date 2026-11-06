import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { BellIcon } from 'lucide-react'
import { useLiveData } from '@/hooks/use-live-data'
import { since } from '@/lib/format'
import { readStored, writeStored } from '@/lib/storage'
import { botHref } from '@/features/bots/bot-model'
import { entriesOf } from '@/features/bots/activity-feed'

const SEEN_KEY = 'skelbot:alerts-seen'
const LIMIT = 20

function useRecentAlerts () {
  const { botList } = useLiveData()
  return botList
    .flatMap(entriesOf)
    .filter(entry => entry.notification.level === 'alert')
    .sort((a, b) => b.notification.at - a.notification.at)
    .slice(0, LIMIT)
}

export function AlertsPopover () {
  const alerts = useRecentAlerts()
  const [seenAt, setSeenAt] = useState(() => Number(readStored(SEEN_KEY)) || 0)
  const unread = alerts.filter(entry => entry.notification.at > seenAt).length

  const onOpenChange = open => {
    if (!open || alerts.length === 0) return
    const latest = alerts[0].notification.at
    setSeenAt(latest)
    writeStored(SEEN_KEY, String(latest))
  }

  return (
    <Popover.Root onOpenChange={onOpenChange}>
      <Popover.Trigger
        className='relative grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-sidebar-accent data-popup-open:text-foreground'
        aria-label={unread ? `Alerts, ${unread} unread` : 'Alerts'}
      >
        <BellIcon className='size-4.5' aria-hidden='true' />
        {unread > 0 && (
          <span className='absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 font-semibold text-[10px] text-white tabular-nums leading-none ring-2 ring-sidebar' aria-hidden='true'>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side='bottom' align='start' sideOffset={8} collisionPadding={12} className='z-50'>
          <Popover.Popup className='flex max-h-[min(28rem,var(--available-height))] w-80 max-w-[calc(100vw-1.5rem)] origin-(--transform-origin) flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-lg outline-none transition-[scale,opacity] data-ending-style:scale-98 data-starting-style:scale-98 data-ending-style:opacity-0 data-starting-style:opacity-0'>
            <div className='flex items-center justify-between border-b px-4 py-3'>
              <Popover.Title className='font-semibold text-sm'>Alerts</Popover.Title>
              <span className='text-muted-foreground text-xs'>{alerts.length ? `Last ${alerts.length}` : ''}</span>
            </div>

            {alerts.length === 0
              ? (
                <p className='px-4 py-8 text-center text-muted-foreground text-sm'>
                  No alerts. Players nearby, kicks and teleports show up here.
                </p>
                )
              : (
                <ol className='min-h-0 flex-1 overflow-y-auto p-1.5'>
                  {alerts.map((entry, index) => {
                    const n = entry.notification
                    const isNew = n.at > seenAt
                    return (
                      <li key={`${entry.bot.id}-${n.at}-${index}`}>
                        <Popover.Close
                          render={<a href={botHref(entry.bot.id)} />}
                          className='flex gap-3 rounded-xl px-2.5 py-2 outline-none transition-colors hover:bg-muted focus-visible:bg-muted'
                        >
                          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${isNew ? 'bg-destructive' : 'bg-transparent'}`} aria-hidden='true' />
                          <span className='min-w-0 flex-1'>
                            <span className='flex items-baseline justify-between gap-2'>
                              <span className='truncate font-medium text-sm'>{n.title}</span>
                              <time className='shrink-0 text-muted-foreground text-xs tabular-nums' dateTime={new Date(n.at).toISOString()}>{since(n.at)}</time>
                            </span>
                            <span className='block truncate text-muted-foreground text-xs'>{entry.bot.name}</span>
                            {n.description && <span className='mt-0.5 line-clamp-2 block text-muted-foreground text-xs'>{n.description}</span>}
                          </span>
                        </Popover.Close>
                      </li>
                    )
                  })}
                </ol>
                )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
