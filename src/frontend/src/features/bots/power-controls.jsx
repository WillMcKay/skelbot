import {
  RotateCwIcon,
  PlayIcon,
  SquareIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { botsApi } from '@/lib/api'
import { isStopped } from './bot-model'

export function BotPowerActions ({ bot, action }) {
  const { pending, run } = action
  const busy = Boolean(pending)
  const stopped = isStopped(bot)

  return (
    <div role='group' aria-label='Bot power controls' className='flex w-full gap-1 rounded-xl border bg-background p-1 sm:w-fit sm:rounded-full'>
      {stopped
        ? (
          <Button size='sm' className='w-full rounded-full sm:w-auto' disabled={busy} onClick={() => run('start', () => botsApi.start(bot.id))}>
            <PlayIcon />Start
          </Button>
          )
        : (
          <>
            <Button size='sm' variant='secondary' className='flex-1 rounded-full sm:flex-none' disabled={busy} onClick={() => run('restart', () => botsApi.restart(bot.id))}>
              <RotateCwIcon />Reset
            </Button>
            <Button size='sm' variant='ghost' className='flex-1 rounded-full sm:flex-none' disabled={bot.status === 'stopping' || busy} onClick={() => run('stop', () => botsApi.stop(bot.id))} title='Picks up the spawners, then leaves'>
              <SquareIcon />Stop
            </Button>
          </>
          )}
    </div>
  )
}
