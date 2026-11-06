import { useEffect, useRef, useState } from 'react'
import { useLiveData } from '@/hooks/use-live-data'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { BotChibi } from './bot-head'
import { attentionFor, botHref, spawnerState, statusOf } from './bot-model'
import { jobIn } from './bot-module-selector'
import { hash } from './scene-kit'

const DOT_BY_TONE = { good: 'bg-emerald-500', warning: 'bg-amber-400', critical: 'bg-red-500', neutral: 'bg-neutral-400' }

const MOTION_BY_ACTIVITY = {
  working: { pace: 'motion-safe:animate-[bot-pace_11s_steps(22)_infinite]', step: 'motion-safe:animate-[bot-step_0.5s_steps(1)_infinite]' },
  idle: { step: 'motion-safe:animate-[bot-step_2.4s_steps(1)_infinite]' },
  waiting: { step: 'motion-safe:animate-[bot-step_1.2s_steps(1)_infinite]' }
}

function activityOf (bot, job) {
  if (bot.auth) return 'waiting'
  if (bot.status === 'restarting') return 'crashed'
  if (bot.status !== 'running') return 'asleep'
  if (!bot.state?.connected) return 'waiting'
  return job ? 'working' : 'idle'
}

const seedOf = id => [...id].reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0)

const DROP_START_MS = 80
const DROP_STAGGER_MS = 40
const LANDS_AFTER_MS = 190
const DUST = [-1, 1]
const MAX_GAINS = 3

function useGains (bot) {
  const total = spawnerState(bot)?.profits?.allTime
  const lastTotal = useRef(total)
  const [gains, setGains] = useState([])

  useEffect(() => {
    const earned = total - lastTotal.current
    lastTotal.current = total
    if (earned > 0) setGains(current => [...current.slice(1 - MAX_GAINS), { id: total, earned }])
  }, [total])

  return [gains, id => setGains(current => current.filter(gain => gain.id !== id))]
}

function BotFigure ({ bot, activity, scene, order }) {
  const status = statusOf(bot)
  const problem = attentionFor(bot)[0]?.title
  const asleep = activity === 'asleep'
  const motion = MOTION_BY_ACTIVITY[activity]
  const seed = seedOf(bot.id)
  const { x, y } = scene.groundSpot(hash(seed), hash(seed + 0.5))
  const [gains, clearGain] = useGains(bot)
  const dropDelay = DROP_START_MS + order * DROP_STAGGER_MS
  const offset = { animationDelay: `${-hash(seed) * 11}s` }

  return (
    <a
      href={botHref(bot.id)}
      aria-label={`${bot.name}: ${problem ?? status.label}`}
      className='group pointer-events-auto absolute -translate-x-1/2 -translate-y-full rounded-sm outline-none hover:z-999! focus-visible:z-999! focus-visible:ring-2 focus-visible:ring-white motion-safe:animate-[bot-drop_0.35s_steps(5)_backwards]'
      style={{ left: `${x / scene.width * 100}%`, top: `${y / scene.height * 100}%`, zIndex: Math.round(y), animationDelay: `${dropDelay}ms` }}
    >
      {DUST.map(direction => (
        <span
          key={direction}
          className='pointer-events-none absolute bottom-0 left-1/2 size-[calc(var(--block)*0.4)] bg-[#ead9a8] opacity-0 motion-safe:animate-[bot-dust_0.25s_steps(3)]'
          style={{ '--drift': `calc(var(--block) * ${direction * 1.75})`, animationDelay: `${dropDelay + LANDS_AFTER_MS}ms` }}
          aria-hidden='true'
        />
      ))}

      <span className={cn('relative block', motion?.pace)} style={offset}>
        <span className={cn('block', motion?.step, asleep && 'opacity-85 grayscale')} style={offset}>
          <span className={cn('block', gains.length > 0 && 'motion-safe:animate-[bot-cheer_0.4s_steps(4)_infinite]')}>
            <BotChibi name={bot.name} className='block h-[calc(var(--pixel)*20)] w-[calc(var(--pixel)*14)]' />
          </span>
        </span>

        {gains.map(({ id, earned }) => (
          <span
            key={id}
            className='pointer-events-none absolute bottom-full left-1/2 whitespace-nowrap font-bold text-[13px] text-lime-300 [text-shadow:1px_1px_0_rgb(0_0_0/85%)] motion-safe:animate-[bot-gain_1.6s_steps(16)_forwards] motion-reduce:hidden'
            onAnimationEnd={() => clearGain(id)}
            aria-hidden='true'
          >
            +{money(earned)}
          </span>
        ))}
      </span>

      {asleep && <span className='pointer-events-none absolute right-0 bottom-full font-bold text-[calc(var(--block)*1.1)] text-white/90 leading-none motion-safe:animate-[bot-snore_3.2s_linear_infinite] motion-reduce:opacity-80' style={offset} aria-hidden='true'>z</span>}

      <span className={cn(
        'pointer-events-none absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-[3px] bg-black/70 px-1.5 py-0.5 font-medium text-[11px] text-white transition-opacity',
        problem && 'sm:opacity-100',
        'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
      )}
      >
        <span className={cn('size-1.5 rounded-full', DOT_BY_TONE[status.tone] ?? DOT_BY_TONE.neutral)} aria-hidden='true' />
        {bot.name}
        <span className='hidden text-white/70 group-hover:inline group-focus-visible:inline'>{problem ?? status.label}</span>
      </span>
    </a>
  )
}

export function SceneFleet ({ scene, bots }) {
  const { modules } = useLiveData()

  return (
    <div className='absolute inset-0 [--block:max(calc(var(--stage-width)/160),5px)] [--pixel:max(calc(var(--block)/6),1.15px)]'>
      {bots.map((bot, order) => <BotFigure key={bot.id} bot={bot} activity={activityOf(bot, jobIn(modules, bot.modules ?? []))} scene={scene} order={order} />)}
    </div>
  )
}
