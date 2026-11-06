import { Input } from '@/components/ui/input'

const MAX_MINUTES = 120

const wholeNumber = text => /^\d+$/.test(text.trim())

function Row ({ label, unit, value, onChange }) {
  return (
    <label className='flex items-center justify-between gap-4 py-1.5 text-sm'>
      <span className='shrink-0 text-muted-foreground'>{label}</span>
      <span className='flex items-center gap-2'>
        <Input
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
          inputMode='numeric'
          autoComplete='off'
          aria-label={label}
          className='w-20 text-right'
        />
        <span className='w-14 text-muted-foreground'>{unit}</span>
      </span>
    </label>
  )
}

function SpawnerFields ({ value, onChange }) {
  return <Row label='Collect every' unit='minutes' value={value.minutes} onChange={minutes => onChange({ ...value, minutes })} />
}

export const spawnerSettings = {
  Settings: SpawnerFields,

  empty: { minutes: '5' },

  valueFrom: (bot, rawBot) => ({
    minutes: String(rawBot.cycleMinutes ?? 5)
  }),

  toRequest: ({ minutes }) => ({ cycleMinutes: Number(minutes) }),

  problem ({ minutes }) {
    return wholeNumber(minutes) && Number(minutes) >= 1 && Number(minutes) <= MAX_MINUTES ? null : `Use 1 to ${MAX_MINUTES} minutes`
  }
}
