import { MoonIcon, PencilIcon, BotIcon } from 'lucide-react'
import { Chip, Panel } from '@/components/panel'
import { Page, PageHero } from '@/components/page-hero'
import { StatusPill } from '@/components/status-pill'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAction } from '@/hooks/use-action'
import { useAnonymous } from '@/hooks/use-anonymous'
import { BLURRED_TEXT } from '@/lib/anonymize'
import { botsApi } from '@/lib/api'
import { place, plural } from '@/lib/format'
import { ActivityFeed, entriesOf } from './activity-feed'
import { ActivityHistory } from './activity-history'
import { BotHead } from './bot-head'
import { botHref, isOnline, statusOf } from './bot-model'
import { RestartNotice, SignInNotice } from './bot-notices'
import { ConsoleCard } from './console-card'
import { InventoryCard } from './inventory-card'
import { viewsForModules } from './modules/registry'
import { BotPowerActions } from './power-controls'

function ActivitySkeleton () {
  return (
    <div role='status' aria-label='Loading activity' className='flex flex-col gap-2'>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className='flex items-center gap-3 rounded-xl px-2 py-2.5' aria-hidden='true'>
          <Skeleton className='size-10 shrink-0 rounded-xl' />
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <Skeleton className='h-4 w-36 max-w-full' />
            <Skeleton className='h-3 w-56 max-w-full' />
          </div>
          <Skeleton className='h-3 w-12 shrink-0' />
        </div>
      ))}
      <span className='sr-only'>Loading activity…</span>
    </div>
  )
}

function OfflineActivity () {
  return (
    <div role='status' className='absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/50 px-4 text-center backdrop-blur-sm'>
      <span className='grid size-12 place-items-center rounded-2xl bg-card text-muted-foreground shadow-sm'>
        <BotIcon className='size-6' aria-hidden='true' />
      </span>
      <div className='flex flex-col gap-1'>
        <p className='font-semibold text-sm'>Bot is offline</p>
        <p className='text-muted-foreground text-sm'>Activity will appear here when the bot is running.</p>
      </div>
    </div>
  )
}

function NoJob ({ bot }) {
  return (
    <Panel>
      <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground'>
          <MoonIcon className='size-5' aria-hidden='true' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='font-semibold text-sm'>This bot has no job</p>
          <p className='text-muted-foreground text-sm'>It stays connected but does nothing until you choose one.</p>
        </div>
        <Button size='sm' className='rounded-full' render={<a href={botHref(bot.id, true)} />}>Choose a job</Button>
      </div>
    </Panel>
  )
}

function Activity ({ bot, offline }) {
  const entries = entriesOf(bot)

  return (
    <Panel
      title='Activity'
      className='min-h-80 flex-1'
      contentClassName='flex-1 min-h-0'
      bodyClassName='flex min-h-0 flex-col'
      flush
      action={<Chip><span className={`size-2 rounded-full ${offline ? 'bg-muted-foreground' : 'bg-emerald-500'}`} aria-hidden='true' />{plural(entries.length, 'event')}</Chip>}
    >
      <div className='relative min-h-0 flex-1 overflow-hidden rounded-xl'>
        <div className='absolute inset-0 overflow-y-auto p-2' aria-hidden={offline || undefined}>
          {entries.length > 0 ? <ActivityFeed entries={entries} /> : <ActivitySkeleton />}
        </div>
        {offline && <OfflineActivity />}
      </div>
    </Panel>
  )
}

export function BotPage ({ bot }) {
  const action = useAction()
  const state = bot.state
  const offline = bot.status === 'stopped' || bot.status === 'stopping'
  const moduleViews = viewsForModules(bot.modules ?? ['spawners'])
  const { anonymous } = useAnonymous()
  const where = place(state?.place)

  return (
    <Page>
      <PageHero
        media={<BotHead name={bot.name} className='size-10 shrink-0 text-muted-foreground' />}
        title={bot.name}
        titleAction={(
          <Button variant='outline' size='icon-sm' className='rounded-full' aria-label={`Edit ${bot.name}`} render={<a href={botHref(bot.id, true)} />}>
            <PencilIcon />
          </Button>
        )}
        description={where && (
          anonymous
            ? <span className={BLURRED_TEXT} aria-label='Location hidden in anonymous mode' title='Hidden in anonymous mode'>{where}</span>
            : where
        )}
        crumbs={[{ label: 'All bots', href: '#/' }, { label: bot.name }]}
        actions={<StatusPill {...statusOf(bot)} />}
        headerActions={<BotPowerActions bot={bot} action={action} />}
      />

      {bot.auth && <SignInNotice code={bot.auth.code} url={bot.auth.url} />}
      {bot.stale && <RestartNotice pending={Boolean(action.pending)} onRestart={() => action.run('restart', () => botsApi.restart(bot.id))} />}

      {moduleViews.length === 0 && <NoJob bot={bot} />}

      {moduleViews.map(({ id, Summary }) => Summary
        ? <Summary key={id} state={state?.modules?.[id]} bot={bot} action={action} />
        : null)}

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_24rem]'>
        <div className='contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4'>
          <ConsoleCard logs={bot.logs ?? []} offline={offline} />
          {moduleViews.map(({ id, Panels }) => Panels
            ? <Panels key={id} state={state?.modules?.[id]} bot={bot} action={action} />
            : <Panel key={id} title={`${id} module`}>This module does not have a dashboard yet.</Panel>)}
        </div>
        <div className='contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4'>
          <ActivityHistory bots={[bot]} title='Uptime' square={false} />
          <InventoryCard slots={state?.inventorySlots} connected={isOnline(bot)} health={state?.health} food={state?.food} />
          <Activity bot={bot} offline={offline} />
        </div>
      </div>
    </Page>
  )
}
