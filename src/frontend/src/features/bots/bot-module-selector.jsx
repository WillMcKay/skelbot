import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { DitherGradient } from '@/components/dither-kit/gradient'
import { cn } from '@/lib/utils'
import { NO_JOB, settingsFor, viewFor } from './modules/registry'
import { SceneCanvas } from './scene-banner'

const isJob = module => (module.kind ?? 'active') === 'active'

export function jobIn (modules, selected) {
  return modules.find(module => isJob(module) && selected.includes(module.id)) ?? null
}

function JobRow ({ art, name, hint, checked, onSelect, settings, value, onChange, open, onOpen, onReveal }) {
  const Settings = checked ? settings?.Settings : null
  const problem = checked ? settings?.problem?.(value) : null

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-card transition-[background-color,border-color,box-shadow]',
        'has-[input[type=radio]:focus-visible]:ring-2 has-[input[type=radio]:focus-visible]:ring-ring',
        checked ? 'border-primary ring-2 ring-primary' : 'hover:bg-muted/50'
      )}
    >
      <div className='relative isolate flex items-center pe-3'>
        <DitherGradient from='grey' direction='right' cell={3} opacity={0.09} className='-z-10' />
        <label className='flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-1.5'>
          <input type='radio' name='bot-job' checked={checked} onChange={onSelect} onClick={onReveal} className='sr-only' />
          <span className='relative grid size-18 shrink-0 place-items-center overflow-hidden rounded-lg'>
            <SceneCanvas scene={art.scene} className='absolute inset-0 size-full' />
          </span>
          <span className='min-w-0 flex-1'>
            <span className='block truncate font-semibold text-sm'>{name}</span>
            <span className={cn('block truncate text-sm', problem ? 'text-warning-foreground' : 'text-muted-foreground')}>{problem ?? hint}</span>
          </span>
        </label>
        {Settings && (
          <button
            type='button'
            onClick={onOpen}
            aria-expanded={open}
            aria-label={`${name} settings`}
            className='grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring'
          >
            <ChevronDownIcon className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden='true' />
          </button>
        )}
      </div>
      {Settings && open && (
        <div className='border-t px-3 py-1.5'>
          <Settings value={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

export function BotModuleSelector ({ modules, selected, onChange, values, onValuesChange }) {
  const [openId, setOpenId] = useState(null)
  const jobs = modules.filter(isJob)
  const job = jobIn(modules, selected)
  const others = selected.filter(id => !jobs.some(module => module.id === id))
  const pick = id => onChange(id ? [id, ...others] : others)

  return (
    <fieldset className='flex flex-col gap-2'>
      <legend className='sr-only'>Job</legend>
      {jobs.map(module => {
        const view = viewFor(module.id)
        return (
          <JobRow
            key={module.id}
            art={view?.art ?? NO_JOB.art}
            name={module.name}
            hint={view?.hint ?? module.description}
            checked={job?.id === module.id}
            onSelect={() => pick(module.id)}
            settings={settingsFor(module.id)}
            value={values[module.id]}
            onChange={value => onValuesChange({ ...values, [module.id]: value })}
            open={openId === module.id}
            onOpen={() => setOpenId(openId === module.id ? null : module.id)}
            onReveal={() => setOpenId(module.id)}
          />
        )
      })}
      <JobRow art={NO_JOB.art} name={NO_JOB.name} hint={NO_JOB.hint} checked={!job} onSelect={() => pick(null)} />
    </fieldset>
  )
}
