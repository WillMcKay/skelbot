import { XIcon } from 'lucide-react'
import eyeIcon from '@/assets/jobs/ender-eye.png'
import { Input } from '@/components/ui/input'
import { MASKED_TEXT } from '@/lib/anonymize'
import { cn } from '@/lib/utils'

const PLAYER = /^[A-Za-z0-9_]{1,16}$/
const MAX_RADIUS = 256
const NEW_BOT = { radius: '20', whitelist: ['MineProbe'], draft: '' }

function validRadius (text) {
  const radius = Number(text)
  return text.trim() !== '' && radius >= 1 && radius <= MAX_RADIUS
}

function withDraft ({ whitelist, draft }) {
  const name = draft.trim()
  const known = whitelist.some(entry => entry.toLowerCase() === name.toLowerCase())
  return name && PLAYER.test(name) && !known ? [...whitelist, name] : whitelist
}

function StealthFields ({ value, onChange, masked }) {
  const set = change => onChange({ ...value, ...change })
  const addDraft = () => set({ whitelist: withDraft(value), draft: PLAYER.test(value.draft.trim()) ? '' : value.draft })

  function onKeyDown (e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addDraft()
    }
    if (e.key === 'Backspace' && !value.draft && value.whitelist.length) {
      set({ whitelist: value.whitelist.slice(0, -1) })
    }
  }

  return (
    <div className='flex flex-col gap-1.5 py-1.5'>
      <label className='flex items-center justify-between gap-4 text-sm'>
        <span className='shrink-0 text-muted-foreground'>Leave within</span>
        <span className='flex items-center gap-2'>
          <Input
            value={value.radius}
            onChange={e => set({ radius: e.target.value.replace(/[^\d]/g, '') })}
            inputMode='numeric'
            autoComplete='off'
            aria-label='Leave within blocks'
            className='w-20 text-right'
          />
          <span className='text-muted-foreground'>blocks</span>
        </span>
      </label>

      <div className='flex flex-col gap-1.5 text-sm'>
        <span className='text-muted-foreground'>Whitelist</span>
        <div className='flex flex-wrap items-center gap-1.5 rounded-xl border p-1.5'>
          {value.whitelist.map(name => (
            <span key={name} className='inline-flex h-7 items-center gap-1 rounded-lg bg-muted ps-2 pe-1 text-[13px]'>
              <span className={cn(masked && MASKED_TEXT)}>{name}</span>
              <button
                type='button'
                aria-label={`Remove ${masked ? 'player' : name}`}
                onClick={() => set({ whitelist: value.whitelist.filter(entry => entry !== name) })}
                className='grid size-5 place-items-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
              >
                <XIcon className='size-3' aria-hidden='true' />
              </button>
            </span>
          ))}
          <input
            value={value.draft}
            onChange={e => set({ draft: e.target.value })}
            onKeyDown={onKeyDown}
            onBlur={addDraft}
            placeholder='Add player'
            aria-label='Add player to whitelist'
            maxLength={16}
            autoComplete='off'
            spellCheck={false}
            className={cn('h-7 min-w-24 flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-muted-foreground', masked && MASKED_TEXT)}
          />
        </div>
      </div>
    </div>
  )
}

export const stealthAddOn = {
  art: { color: 'purple', item: eyeIcon },
  hint: 'Leave when a player comes near',
  Settings: StealthFields,

  empty: NEW_BOT,

  valueFrom: (bot, rawBot) => ({
    radius: String(rawBot.stealthRadius ?? 20),
    whitelist: rawBot.stealthWhitelist ?? ['MineProbe'],
    draft: ''
  }),

  toRequest: value => ({
    stealthRadius: Number(value.radius),
    stealthWhitelist: withDraft(value)
  }),

  problem ({ radius, draft }) {
    if (!validRadius(radius)) return `Use a distance from 1 to ${MAX_RADIUS}`
    if (draft.trim() && !PLAYER.test(draft.trim())) return 'That is not a player name'
    return null
  },

  summary ({ radius, whitelist }, masked) {
    const count = whitelist.length
    const ignores = count === 0
      ? ''
      : count === 1 && !masked ? `, ignores ${whitelist[0]}` : `, ignores ${count} ${count === 1 ? 'player' : 'players'}`
    return `Leaves within ${radius} blocks${ignores}`
  }
}
