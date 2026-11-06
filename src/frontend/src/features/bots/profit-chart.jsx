import { useMemo, useState } from 'react'
import { Bar } from '@/components/dither-kit/bar'
import { BarChart } from '@/components/dither-kit/bar-chart'
import { Grid } from '@/components/dither-kit/grid'
import { Tooltip } from '@/components/dither-kit/tooltip'
import { XAxis } from '@/components/dither-kit/x-axis'
import { YAxis } from '@/components/dither-kit/y-axis'
import { Panel } from '@/components/panel'
import { Segmented } from '@/components/segmented'
import { Skeleton } from '@/components/ui/skeleton'
import { hourOfDay, money } from '@/lib/format'

const config = { profit: { label: 'Profit', color: 'primary' } }
const RANGES = { day: 'Last 24 hours', week: 'Last week', all: 'All time' }
const RANGE_MS = { day: 24 * 60 * 60 * 1000, week: 7 * 24 * 60 * 60 * 1000 }
const CURRENT_HOUR_DIM = 0.45

function dateLabel (at, options) {
  return new Date(at).toLocaleDateString([], options)
}

function toRows (history, range) {
  const now = Date.now()
  const filtered = range === 'all'
    ? history
    : history.filter(entry => entry.startedAt >= now - RANGE_MS[range])

  if (range === 'all') {
    const days = new Map()

    for (const entry of filtered) {
      const date = new Date(entry.startedAt)
      date.setHours(0, 0, 0, 0)
      const startedAt = date.getTime()
      const day = days.get(startedAt) ?? { startedAt, profit: 0, current: false }
      day.profit += entry.profit
      day.current ||= Boolean(entry.current)
      days.set(startedAt, day)
    }

    return [...days.values()].map(day => ({
      key: day.startedAt,
      period: dateLabel(day.startedAt, { month: 'short', day: 'numeric' }),
      label: `${dateLabel(day.startedAt, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${day.current ? ' (so far)' : ''}`,
      profit: day.profit,
      dim: day.current ? CURRENT_HOUR_DIM : 1
    }))
  }

  return filtered.map(entry => ({
    key: entry.startedAt,
    period: range === 'day'
      ? hourOfDay(entry.startedAt)
      : dateLabel(entry.startedAt, { month: 'short', day: 'numeric' }),
    label: `${dateLabel(entry.startedAt, { weekday: 'long', month: 'long', day: 'numeric' })} · ${hourOfDay(entry.startedAt)}${entry.current ? ' (so far)' : ''}`,
    profit: entry.profit,
    dim: entry.current ? CURRENT_HOUR_DIM : 1
  }))
}

function ProfitBars ({ rows }) {
  return (
    <div className='h-60 w-full'>
      <BarChart data={rows} config={config} margins={{ left: 52 }}>
        <Grid />
        <XAxis dataKey='period' maxTicks={8} />
        <YAxis tickFormatter={money} tickCount={3} />
        <Tooltip labelKey='label' valueFormatter={value => money(value)} />
        <Bar dataKey='profit' variant='gradient' />
      </BarChart>
    </div>
  )
}

export function ProfitChart ({ history }) {
  const [range, setRange] = useState('day')
  const available = Array.isArray(history)
  const signature = JSON.stringify(history ?? [])
  const rows = useMemo(() => toRows(history ?? [], range), [signature, range])
  const picker = <Segmented label='Profit history range' size='sm' value={range} onChange={setRange} options={RANGES} />
  const description = range === 'all' ? 'Daily totals · All time' : `Hourly totals · ${RANGES[range].toLowerCase()}`

  return (
    <Panel
      title='Profit history'
      className='@container'
      description={description}
      action={available && <div className='hidden @xl:block'>{picker}</div>}
    >
      {available && <div className='mb-3 @xl:hidden'>{picker}</div>}
      {!available
        ? (
          <div role='status' aria-label='Loading profit history' className='flex h-60 flex-col justify-end gap-3 px-12 pb-8'>
            <div className='flex h-full items-end justify-around gap-2' aria-hidden='true'>
              {[36, 58, 44, 76, 52, 88, 63, 42, 70, 50, 82, 60].map((height, index) => (
                <Skeleton key={index} className='w-full max-w-8 rounded-t-md' style={{ height: `${height}%` }} />
              ))}
            </div>
            <Skeleton className='h-3 w-full' />
            <span className='sr-only'>Loading profit history…</span>
          </div>
          )
        : <ProfitBars rows={rows} />}
    </Panel>
  )
}
