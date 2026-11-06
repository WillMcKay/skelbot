import { HouseIcon, PlusIcon, BotIcon } from 'lucide-react'
import { DitherGradient } from '@/components/dither-kit/gradient'
import { ErrorBoundary } from '@/components/error-boundary'
import { Line } from '@/components/dither-kit/line'
import { LineChart } from '@/components/dither-kit/line-chart'
import { Tooltip } from '@/components/dither-kit/tooltip'
import { Chip, Panel } from '@/components/panel'
import { Page, PageHero } from '@/components/page-hero'
import { RollingMoney } from '@/components/rolling-money'
import { StatGroup, StatTile } from '@/components/stat-tile'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { CardFrame } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useLiveData } from '@/hooks/use-live-data'
import { useReveal } from '@/hooks/use-reveal'
import { hours, money, plural } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ActivityFeed, entriesOf } from './activity-feed'
import { ActivityHistory } from './activity-history'
import { BotHead } from './bot-head'
import { attentionFor, botHref, fleetHistory, isOnline, statusOf, totals } from './bot-model'
import { jobIn } from './bot-module-selector'
import { desertScene } from './desert-scene'
import { NO_JOB, viewFor } from './modules/registry'
import { SceneBanner } from './scene-banner'
import { SceneFleet } from './scene-fleet'

const FEED_LIMIT = 10
const HOUR_MS = 60 * 60 * 1000
const MINI_CHART_CONFIG = { profit: { label: 'Profit', color: 'primary' } }

function AddBotButton () {
  return <Button size='sm' className='rounded-full' render={<a href='#/bots/new' />}><PlusIcon />Add bot</Button>
}

function NoBots () {
  return (
    <Empty className='rounded-3xl bg-card py-16'>
      <EmptyHeader>
        <EmptyMedia><span className='grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground'><BotIcon className='size-7' /></span></EmptyMedia>
        <EmptyTitle>No bots yet</EmptyTitle>
        <EmptyDescription>Add a Minecraft account to start farming. Each bot runs on its own, so one crashing or getting kicked does not affect the others.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><AddBotButton /></EmptyContent>
    </Empty>
  )
}

function ProfitSparkline ({ history, name }) {
  const data = (history ?? [])
    .filter(entry => Number.isFinite(entry.profit))
    .slice(-24)
    .map((entry, index) => ({
      period: index,
      profit: entry.profit,
      label: Number.isFinite(entry.startedAt)
        ? `${new Date(entry.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${new Date(entry.startedAt).toLocaleTimeString([], { hour: 'numeric' })}${entry.current ? ' (so far)' : ''}`
        : `Hour ${index + 1}`
    }))

  if (data.length < 2) {
    return (
      <div className='flex h-12 items-center' role='img' aria-label={`Profit history for ${name} is not available yet`}>
        <div className='h-px w-full bg-border' />
      </div>
    )
  }

  return (
    <div role='group' aria-label={`Profit per hour history for ${name}. Hover the chart to inspect hourly values.`} className='h-12 w-full'>
      <LineChart
        data={data}
        config={MINI_CHART_CONFIG}
        animate={false}
        margins={{ top: 2, right: 2, bottom: 0, left: 2 }}
      >
        <Line dataKey='profit' />
        <Tooltip labelKey='label' valueFormatter={value => money(value)} />
      </LineChart>
    </div>
  )
}

function JobLabel ({ job }) {
  const Icon = (job && viewFor(job.id)?.icon) ?? NO_JOB.icon

  return (
    <span className='flex min-w-0 items-center gap-1 text-muted-foreground text-xs'>
      <Icon className='size-3.5 shrink-0' aria-hidden='true' />
      <span className='truncate'>{job?.name ?? NO_JOB.name}</span>
    </span>
  )
}

function CardBody ({ bot, view, state }) {
  if (!view) return <p className='flex h-12 items-center text-muted-foreground text-sm'>Choose a job to put this bot to work</p>
  if (bot.modules?.includes('spawners') && state) return <ProfitSparkline history={state.history} name={bot.name} />
  return <p className='flex h-12 items-center text-muted-foreground text-sm'>Stats appear when it next runs</p>
}

const WASH_BY_TONE = { good: 'green', warning: 'orange', critical: 'red', neutral: 'grey' }

function BotCard ({ bot }) {
  const { modules } = useLiveData()
  const job = jobIn(modules, bot.modules ?? [])
  const view = job && viewFor(job.id)
  const state = job && bot.state?.modules?.[job.id]
  const stats = (state && view?.cardStats?.(state)) ?? [{ label: 'Last 24h', value: '—' }, { label: 'Per hour', value: '—' }]
  const reveal = useReveal()

  return (
    <a ref={reveal} href={botHref(bot.id)} className='group rounded-2xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring hover:-translate-y-0.5'>
      <CardFrame className='isolate h-full gap-0 overflow-hidden rounded-2xl p-4 transition-colors group-hover:bg-muted/70'>
        <div className='pointer-events-none absolute inset-x-0 top-0 z-0 h-20' aria-hidden='true'>
          <DitherGradient from={WASH_BY_TONE[statusOf(bot).tone] ?? 'grey'} direction='down' cell={3} opacity={0.09} />
        </div>
        <div className='relative flex items-center gap-2'>
          <BotHead name={bot.name} className='size-8 text-muted-foreground' />
          <div className='min-w-0 flex-1'>
            <div className='flex items-center justify-between gap-2'>
              <p className='truncate font-semibold'>{bot.name}</p>
              <StatusPill {...statusOf(bot)} size='xs' className='shrink-0' />
            </div>
            <JobLabel job={job} />
          </div>
        </div>
        <div className='relative mt-3'>
          <CardBody bot={bot} view={view} state={state} />
        </div>
        <div className='relative grid grid-cols-2 border-t border-border/70 pt-3'>
          {stats.map(({ label, value }, index) => (
            <div key={label} className={cn('min-w-0', index > 0 && 'border-l border-border/70 pl-4')}>
              <p className='text-muted-foreground text-xs'>{label}</p>
              <p className='mt-0.5 truncate font-semibold tabular-nums'>{value}</p>
            </div>
          ))}
        </div>
      </CardFrame>
    </a>
  )
}

function BrokenBotCard ({ bot }) {
  return (
    <a href={botHref(bot.id)} className='group rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring'>
      <CardFrame className='h-full min-h-[12rem] rounded-2xl p-4 transition-colors group-hover:bg-muted/70'>
        <div className='relative'>
          <p className='truncate font-semibold'>{bot.name}</p>
          <p className='mt-1 text-muted-foreground text-sm'>This card hit an error. The bot itself isn't affected.</p>
        </div>
      </CardFrame>
    </a>
  )
}

function AddBotCard () {
  const reveal = useReveal()

  return (
    <a ref={reveal} href='#/bots/new' aria-label='Add a bot' className='group rounded-2xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring hover:-translate-y-0.5'>
      <CardFrame className='h-full min-h-[12rem] rounded-2xl border border-dashed border-border/80 p-4 text-center transition-colors group-hover:bg-muted/70'>
        <span className='relative z-10 flex h-full min-h-[10rem] flex-col items-center justify-center gap-3'>
          <span className='grid size-11 place-items-center rounded-full border border-border bg-muted text-muted-foreground transition-colors group-hover:border-transparent group-hover:bg-primary-soft group-hover:text-primary-strong' aria-hidden='true'>
            <PlusIcon className='size-5' />
          </span>
          <span className='font-medium text-sm'>Add a bot</span>
        </span>
      </CardFrame>
    </a>
  )
}

function fleetSummary (bots) {
  const online = `${bots.filter(isOnline).length} of ${plural(bots.length, 'bot')} online`
  const waiting = bots.flatMap(attentionFor).length
  return waiting > 0 ? `${online} · ${waiting} ${waiting === 1 ? 'needs' : 'need'} you` : online
}

function FleetStats ({ bots }) {
  const t = totals(bots)

  return (
    <StatGroup fill>
      <StatTile size='lg' className='col-span-full' label='Last 24h' value={<RollingMoney value={t.last24h} />}>
        <ProfitSparkline history={fleetHistory(bots)} name='all bots' />
      </StatTile>
      <StatTile size='sm' label='Per hour' value={<RollingMoney value={t.perHour} />} hint={t.online > 0 ? 'Last 24h average' : 'No bots online'} />
      <StatTile size='sm' label='All time' value={<RollingMoney value={t.allTime} />} hint={`${hours(t.runHours)} farmed`} />
    </StatGroup>
  )
}

function OverviewHero ({ bots, compact }) {
  return (
    <SceneBanner
      scene={desertScene}
      compact={compact}
      className='[&_nav]:hidden sm:[&_nav]:flex xl:aspect-[3.84] xl:h-full xl:min-h-0'
      overlay={<SceneFleet scene={desertScene} bots={bots} />}
    >
      <PageHero
        icon={HouseIcon}
        title='All bots'
        description={bots.length > 0 && fleetSummary(bots)}
        crumbs={[{ label: 'skelbot' }, { label: 'All bots' }]}
      />
    </SceneBanner>
  )
}

export function OverviewPage ({ bots }) {
  if (bots.length === 0) return <Page><OverviewHero bots={bots} /><NoBots /></Page>

  const entries = bots.flatMap(entriesOf)
  const recent = [...entries].sort((a, b) => b.notification.at - a.notification.at).slice(0, FEED_LIMIT)

  return (
    <Page>
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]'>
        <OverviewHero bots={bots} compact />
        <FleetStats bots={bots} />
      </div>

      <div className='grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3'>
        {bots.map(bot => (
          <ErrorBoundary key={bot.id} fallback={() => <BrokenBotCard bot={bot} />}>
            <BotCard bot={bot} />
          </ErrorBoundary>
        ))}
        <AddBotCard />
      </div>

      <div className='grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]'>
        <Panel
          title='Recent activity'
          className='h-full'
          contentClassName='flex-1'
          bodyClassName='max-h-40 overflow-y-auto'
          action={<Chip><span className='size-2 rounded-full bg-emerald-500' aria-hidden='true' />{plural(entries.length, 'event')}</Chip>}
        >
          <ActivityFeed entries={recent} showBot empty='Nothing yet. Alerts, cycle results and connection changes show up here.' />
        </Panel>
        <ActivityHistory bots={bots} />
      </div>
    </Page>
  )
}
