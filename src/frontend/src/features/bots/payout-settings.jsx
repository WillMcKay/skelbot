import goldIcon from '@/assets/jobs/gold-ingot.png'
import { Input } from '@/components/ui/input'
import { MASKED_TEXT } from '@/lib/anonymize'
import { moneyInput, parseMoney, shortMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

const PLAYER = /^[A-Za-z0-9_]{1,16}$/

const PRESETS = { minimum: ['100k', '1m', '10m'], keep: ['10k', '100k', '1m'] }

function MoneyField ({ label, value, presets, onChange }) {
  return (
    <div className='flex min-w-0 flex-col gap-1.5 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='relative block'>
        <span className='pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground'>$</span>
        <Input
          value={value}
          onChange={e => onChange(e.target.value.replace(/[$\s]/g, ''))}
          placeholder='0'
          autoComplete='off'
          aria-label={label}
          className='[&_input]:!ps-6'
        />
      </span>
      <span className='flex gap-1'>
        {presets.map(preset => {
          const active = parseMoney(value) === parseMoney(preset)
          return (
            <button
              key={preset}
              type='button'
              aria-pressed={active}
              onClick={() => onChange(active ? '' : preset)}
              className={cn(
                'h-6 flex-1 rounded-md text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {preset}
            </button>
          )
        })}
      </span>
    </div>
  )
}

function payoutPreview ({ minimum, keep }) {
  const min = parseMoney(minimum)
  const kept = parseMoney(keep)
  if (min === null || kept === null) return null

  if (min > 0 && kept >= min) return `Nothing sends until the balance passes ${shortMoney(kept)}.`
  if (min > 0 && kept > 0) return `At ${shortMoney(min)}: sends ${shortMoney(min - kept)}, keeps ${shortMoney(kept)}.`
  if (min > 0) return `Sends the full balance once it reaches ${shortMoney(min)}.`
  if (kept > 0) return `Sends everything above ${shortMoney(kept)}.`
  return 'Sends the full balance as it comes in.'
}

function PayoutFields ({ value, onChange, masked }) {
  const set = change => onChange({ ...value, ...change })
  const preview = payoutPreview(value)

  return (
    <div className='flex flex-col gap-3 py-1.5'>
      <label className='flex flex-col gap-1.5 text-sm'>
        <span className='text-muted-foreground'>Send to</span>
        <Input
          value={value.to}
          onChange={e => set({ to: e.target.value })}
          placeholder='Player name'
          maxLength={16}
          autoComplete='off'
          spellCheck={false}
          aria-label='Send to'
          className={cn(masked && MASKED_TEXT)}
        />
      </label>
      <div className='grid grid-cols-2 gap-3'>
        <MoneyField label='Pay out at' value={value.minimum} presets={PRESETS.minimum} onChange={minimum => set({ minimum })} />
        <MoneyField label='Always keep' value={value.keep} presets={PRESETS.keep} onChange={keep => set({ keep })} />
      </div>
      {preview && <p className='rounded-lg bg-muted px-3 py-2 text-muted-foreground text-xs' aria-live='polite'>{preview}</p>}
    </div>
  )
}

export const payoutAddOn = {
  art: { color: 'orange', item: goldIcon },
  hint: 'Send earnings to another player',
  Settings: PayoutFields,

  empty: { to: '', minimum: '', keep: '' },

  valueFrom: (bot, rawBot) => ({
    to: rawBot.payoutTo ?? '',
    minimum: moneyInput(bot.payoutMin),
    keep: moneyInput(bot.payoutKeep)
  }),

  toRequest: ({ to, minimum, keep }) => ({
    payoutTo: to.trim(),
    payoutMin: parseMoney(minimum),
    payoutKeep: parseMoney(keep)
  }),

  problem ({ to, minimum, keep }) {
    if (!to.trim()) return 'Choose a player'
    if (!PLAYER.test(to.trim())) return 'That is not a player name'
    if (parseMoney(minimum) === null || parseMoney(keep) === null) return 'Use amounts like 500k or 1.5m'
    return null
  },

  summary ({ to, minimum, keep }, masked) {
    const min = parseMoney(minimum)
    const kept = parseMoney(keep)
    const when = min > 0 ? ` at ${shortMoney(min)}` : ''
    return `Sends to ${masked ? '•••' : to.trim()}${when}${kept > 0 ? `, keeps ${shortMoney(kept)}` : ''}`
  }
}
