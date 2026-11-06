import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { DitherGradient } from '@/components/dither-kit/gradient'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { settingsFor } from './modules/registry'

const isAddOn = module => module.kind === 'passive'

export function initialSettings (modules, bot, rawBot) {
  return Object.fromEntries(modules.flatMap(({ id }) => {
    const view = settingsFor(id)
    if (!view?.empty) return []
    return [[id, bot ? view.valueFrom(bot, rawBot) : view.empty]]
  }))
}

export function settingsRequest (values) {
  return Object.assign({}, ...Object.entries(values).map(([id, value]) => settingsFor(id).toRequest(value)))
}

export function settingsProblem (modules, selected, values) {
  return modules
    .filter(module => selected.includes(module.id))
    .some(({ id }) => settingsFor(id)?.problem?.(values[id]))
}

function AddOnRow ({ module, enabled, open, value, onToggle, onOpen, onChange, masked }) {
  const view = settingsFor(module.id)
  const Settings = view?.Settings
  const art = view?.art
  const problem = enabled ? view?.problem?.(value) : null
  const line = problem ?? (enabled && view?.summary ? view.summary(value, masked) : view?.hint ?? module.description)
  const expandable = enabled && Boolean(Settings)

  return (
    <li className='shrink-0 overflow-hidden rounded-xl border bg-card'>
      <div className='flex items-center gap-3 p-2 pe-3'>
        <button
          type='button'
          onClick={expandable ? onOpen : undefined}
          aria-expanded={expandable ? open : undefined}
          aria-disabled={!expandable}
          className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring', !expandable && 'cursor-default')}
        >
          <span className='relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg'>
            <DitherGradient from={art?.color ?? 'grey'} direction='right' cell={3} opacity={0.5} />
            {art?.item && <img src={art.item} alt='' draggable={false} className='relative size-7 object-contain [image-rendering:pixelated]' />}
          </span>
          <span className='min-w-0 flex-1'>
            <span className='block truncate font-semibold text-sm'>{module.name}</span>
            <span className={cn('block truncate text-xs', problem ? 'text-warning-foreground' : 'text-muted-foreground')}>{line}</span>
          </span>
          {expandable && <ChevronDownIcon className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden='true' />}
        </button>
        <Switch checked={enabled} onCheckedChange={onToggle} aria-label={module.name} />
      </div>
      {expandable && open && (
        <div className='border-t px-3 py-1.5'>
          <Settings value={value} onChange={onChange} masked={masked} />
        </div>
      )}
    </li>
  )
}

export function AddOnList ({ modules, selected, onSelectedChange, values, onValuesChange, masked }) {
  const [openId, setOpenId] = useState(null)
  const addOns = modules.filter(isAddOn)

  if (addOns.length === 0) return <p className='text-muted-foreground text-sm'>No add-ons yet. Restart the manager to load them.</p>

  function toggle (id, on) {
    onSelectedChange(on ? [...selected, id] : selected.filter(moduleId => moduleId !== id))
    setOpenId(on ? id : null)
  }

  return (
    <ul className='-mx-1 flex max-h-[26rem] flex-col gap-2 overflow-y-auto px-1 py-0.5'>
      {addOns.map(module => (
        <AddOnRow
          key={module.id}
          module={module}
          enabled={selected.includes(module.id)}
          open={openId === module.id}
          value={values[module.id]}
          onToggle={on => toggle(module.id, on)}
          onOpen={() => setOpenId(openId === module.id ? null : module.id)}
          onChange={value => onValuesChange({ ...values, [module.id]: value })}
          masked={masked}
        />
      ))}
    </ul>
  )
}
