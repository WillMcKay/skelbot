import {
  BellIcon,
  ActivityIcon,
  CircleCheckIcon,
  CircleAlertIcon,
  TriangleAlertIcon
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { since } from '@/lib/format'
import { BotHead } from './bot-head'

const DAY_MS = 24 * 60 * 60 * 1000

const LEVELS = {
  alert: { label: 'Alert', variant: 'error', icon: BellIcon },
  error: { label: 'Failed', variant: 'error', icon: CircleAlertIcon },
  warning: { label: 'Warning', variant: 'warning', icon: TriangleAlertIcon },
  info: { label: 'Done', variant: 'success', icon: CircleCheckIcon }
}

const EVENTS = {
  'daily-report': { label: 'Report', variant: 'info', icon: ActivityIcon }
}

function styleOf (n) {
  return (n.level === 'info' && EVENTS[n.event]) || LEVELS[n.level] || LEVELS.info
}

function groupOf (at, now) {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0)
  if (at >= startOfToday) return 'Today'
  if (at >= startOfToday - DAY_MS) return 'Earlier'
  return 'This week'
}

function shortSince (at) {
  return since(at).replace(' ago', '').replace('just now', 'now')
}

function Row ({ entry, showBot }) {
  const n = entry.notification
  const style = styleOf(n)

  return (
    <li className='flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60'>
      {showBot
        ? <BotHead name={entry.bot.name} className='size-10 text-muted-foreground' />
        : <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-muted'><style.icon className='size-4.5' aria-hidden='true' /></span>}
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='font-medium text-[15px]'>{showBot ? entry.bot.name : n.title}</span>
          <Badge variant={style.variant} size='sm' className='rounded-md px-1.5'>{showBot ? n.title : style.label}</Badge>
        </div>
        {n.description && <p className='mt-0.5 truncate text-muted-foreground text-sm'>{n.description}</p>}
      </div>
      <time className='shrink-0 pt-0.5 text-muted-foreground text-sm tabular-nums' dateTime={new Date(n.at).toISOString()}>{shortSince(n.at)}</time>
    </li>
  )
}

export function ActivityFeed ({ entries, showBot = false, empty = 'Nothing yet.' }) {
  if (entries.length === 0) return <p className='px-2 py-6 text-center text-muted-foreground text-sm'>{empty}</p>

  const now = Date.now()
  const groups = new Map()
  for (const entry of [...entries].sort((a, b) => b.notification.at - a.notification.at)) {
    const name = groupOf(entry.notification.at, now)
    groups.set(name, [...(groups.get(name) ?? []), entry])
  }

  return (
    <div className='flex flex-col gap-3'>
      {[...groups].map(([name, list]) => (
        <section key={name}>
          <h3 className='px-2 pb-1 font-medium text-muted-foreground text-xs'>{name}</h3>
          <ol>{list.map((entry, i) => <Row key={`${entry.notification.at}-${i}`} entry={entry} showBot={showBot} />)}</ol>
        </section>
      ))}
    </div>
  )
}

export const entriesOf = bot => (bot.notifications ?? []).map(notification => ({ bot, notification }))
