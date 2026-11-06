import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Panel } from '@/components/panel'
import { Tooltip, TooltipCreateHandle, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const GAP = 4
const MONTH_ROW = 16
const CELL_MAX = 22
const MIN_WEEKS = 4
const MAX_WEEKS = 52

const LEVEL_MINS = [0, 1, 50, 80, 95]

function localDayKey (at) {
  const date = new Date(at)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfLocalDay (at) {
  const date = new Date(at)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function addLocalDays (at, days) {
  const date = new Date(at)
  date.setDate(date.getDate() + days)
  return date.getTime()
}

function historyByLocalDay (history = {}) {
  return Object.fromEntries(Object.entries(history).map(([utcDay, duration]) => [
    localDayKey(Date.parse(`${utcDay}T00:00:00Z`)),
    duration
  ]))
}

function formatDate (at, options) {
  return new Date(at).toLocaleDateString([], options)
}

function durationLabel (milliseconds) {
  const minutes = Math.floor(milliseconds / 60000)
  const hours = Math.floor(minutes / 60)
  if (hours < 1) return `${minutes}m`
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

function levelOf (percent) {
  return LEVEL_MINS.findLastIndex(min => percent >= min)
}

function dayUptime (bot, history, start, now) {
  const trackingSince = bot.uptime?.trackingSince
  if (!Number.isFinite(trackingSince)) return { online: 0, observed: 0 }

  const end = Math.min(addLocalDays(start, 1), now)
  const observed = Math.max(0, end - Math.max(start, trackingSince))
  let online = Math.min(observed, history[localDayKey(start)] ?? 0)

  if (bot.state?.connected && Number.isFinite(bot.uptime?.checkpointAt)) {
    const activeStart = Math.max(start, trackingSince, bot.uptime.checkpointAt)
    online += Math.max(0, end - activeStart)
  }

  return { online: Math.min(online, observed), observed }
}

function buildWeeks (bots, now, weekCount) {
  const today = startOfLocalDay(now)
  const mondayOffset = (new Date(today).getDay() + 6) % 7
  const firstDay = addLocalDays(today, -mondayOffset - (weekCount - 1) * 7)
  const isFirstOfMonth = day => new Date(day.at).getDate() === 1
  const trackedBots = bots.map(bot => ({ bot, history: historyByLocalDay(bot.uptime?.history) }))

  const weeks = []
  for (let w = 0; w < weekCount; w++) {
    const days = []
    for (let d = 0; d < 7; d++) {
      const at = addLocalDays(firstDay, w * 7 + d)
      if (at > today) {
        days.push({ at, future: true })
        continue
      }

      let online = 0
      let observed = 0
      for (const { bot, history } of trackedBots) {
        const u = dayUptime(bot, history, at, now)
        online += u.online
        observed += u.observed
      }

      const date = formatDate(at, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      if (!observed) {
        days.push({ at, level: 0, date, detail: 'Not tracked' })
        continue
      }

      const percent = Math.round((online / observed) * 100)
      days.push({ at, level: levelOf(percent), date, detail: `${durationLabel(online)} online · ${percent}%` })
    }
    weeks.push(days)
  }

  const monthLabels = weeks.map((days, w) => {
    const first = days.find(isFirstOfMonth)
    if (first) return formatDate(first.at, { month: 'short' })
    if (w === 0 && !weeks.slice(1, 3).some(ds => ds.some(isFirstOfMonth))) {
      return formatDate(days[0].at, { month: 'short' })
    }
    return ''
  })

  return { weeks, monthLabels }
}

function useWeekCount (ref) {
  const [weeks, setWeeks] = useState(9)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const cell = Math.min(CELL_MAX, (el.clientHeight - MONTH_ROW - 7 * GAP) / 7)
      if (!(cell > 0)) return
      const fit = Math.ceil((el.clientWidth + GAP) / (cell + GAP))
      setWeeks(Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, fit)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return weeks
}

function sameBots (previous, next) {
  if (previous.title !== next.title || previous.square !== next.square || previous.bots.length !== next.bots.length) return false
  return previous.bots.every((bot, index) => {
    const other = next.bots[index]
    return bot.id === other.id &&
      bot.state?.connected === other.state?.connected &&
      bot.uptime?.history === other.uptime?.history &&
      bot.uptime?.trackingSince === other.uptime?.trackingSince &&
      bot.uptime?.connectedSince === other.uptime?.connectedSince &&
      bot.uptime?.checkpointAt === other.uptime?.checkpointAt
  })
}

function ActivityHistoryView ({ bots, title = 'Bot uptime', square = true }) {
  const wrapRef = useRef(null)
  const [tooltip] = useState(() => TooltipCreateHandle())
  const weekCount = useWeekCount(wrapRef)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const { weeks, monthLabels } = useMemo(() => buildWeeks(bots, now, weekCount), [bots, now, weekCount])

  return (
    <Panel
      title={title}
      className='w-full'
      contentClassName={cn('p-0', square ? 'aspect-square' : 'flex-1')}
      bodyClassName='flex min-h-0 flex-col gap-3 p-3'
      flush
    >
      <div ref={wrapRef} className={cn('relative min-h-0 flex-1', !square && 'min-h-32')}>
        <div
          role='group'
          aria-label={`Daily bot uptime for the last ${weekCount} weeks`}
          className='absolute inset-x-0 top-1/2 grid w-full -translate-y-1/2'
          style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))`, gap: GAP }}
        >
          {monthLabels.map((label, w) => (
            <span key={`m${w}`} className='h-4 overflow-visible whitespace-nowrap text-muted-foreground text-xs leading-none'>
              {label}
            </span>
          ))}
          {Array.from({ length: 7 }, (_, d) => weeks.map(week => {
            const day = week[d]
            return (
              day.future
                ? <span key={day.at} className='aspect-square w-full' />
                : (
                  <TooltipTrigger
                    key={day.at}
                    handle={tooltip}
                    payload={day}
                    delay={0}
                    closeDelay={0}
                    aria-label={`${day.date}: ${day.detail}`}
                    render={<span />}
                    className={cn('aspect-square w-full rounded-[4px] outline-none transition-shadow hover:ring-2 hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-ring', `uptime-level-${day.level}`)}
                  />
                  )
            )
          }))}
        </div>
      </div>

      <Tooltip handle={tooltip}>
        {({ payload }) => payload && (
          <TooltipPopup side='top' sideOffset={6}>
            <div className='font-mono text-[10px] text-muted-foreground'>{payload.date}</div>
            <div className='font-mono text-[11px] tabular-nums'>{payload.detail}</div>
          </TooltipPopup>
        )}
      </Tooltip>

      <div className='flex items-center justify-end gap-1.5 text-muted-foreground text-xs' aria-hidden='true'>
        <span className='mr-1'>Less</span>
        {LEVEL_MINS.map((_, i) => (
          <span key={i} className={cn('size-3 rounded-[3px]', `uptime-level-${i}`)} />
        ))}
        <span className='ml-1'>More</span>
      </div>
    </Panel>
  )
}

export const ActivityHistory = memo(ActivityHistoryView, sameBots)
