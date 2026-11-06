import { RotateCcwIcon, ActivityIcon, ClockIcon, CoinsIcon, BoxIcon, SparklesIcon } from 'lucide-react'
import { RollingMoney } from '@/components/rolling-money'
import { StatGroup, StatTile } from '@/components/stat-tile'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { botsApi } from '@/lib/api'
import { count, hours, money, plural } from '@/lib/format'
import { earnedLast24h, isOnline, ratePerHour } from '../../bot-model'

function Stats ({ state, bot, action }) {
  const refreshing = action.pending === 'refresh'
  const refreshBalance = () => action.run('refresh', () => botsApi.command(bot.id, 'refresh'))

  return (
    <StatGroup>
      <StatTile icon={SparklesIcon} label='All time' value={<RollingMoney value={state.profits.allTime} />} hint={`${hours(state.rates.runHours)} farmed`} />
      <StatTile icon={ActivityIcon} label='Last 24h' value={<RollingMoney value={earnedLast24h(state)} />} hint={`This session ${money(state.profits.session)}`} />
      <StatTile icon={ClockIcon} label='Per hour' value={<RollingMoney value={ratePerHour(state)} />} hint='Last 24h average' />
      {state.spawners && <StatTile icon={BoxIcon} label='Spawners' value={count(state.spawners.placed)} hint={`${plural(state.spawners.stacks, 'stack')} when picked up`} />}
      <StatTile
        icon={CoinsIcon}
        label='Balance'
        value={<RollingMoney value={state.balance} />}
        hint={state.lastIncome == null ? null : `Last delivery ${money(state.lastIncome)}`}
        action={(
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            className='-me-1 text-muted-foreground hover:text-foreground'
            aria-label='Refresh balance'
            title='Refresh balance'
            disabled={!isOnline(bot) || Boolean(action.pending)}
            onClick={refreshBalance}
          >
            <RotateCcwIcon className={refreshing ? 'animate-spin' : undefined} />
          </Button>
        )}
      />
    </StatGroup>
  )
}

function StatsSkeleton () {
  return (
    <StatGroup>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className='flex flex-col gap-2 rounded-xl bg-card p-4' aria-hidden='true'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-7 w-24' />
          <Skeleton className='h-3 w-28' />
        </div>
      ))}
      <span className='sr-only'>Loading bot statistics…</span>
    </StatGroup>
  )
}

export function SpawnersSummary ({ state, bot, action }) {
  return state ? <Stats state={state} bot={bot} action={action} /> : <StatsSkeleton />
}
