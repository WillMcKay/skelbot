import { useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { ChoiceLabel, FormSection } from './form-section'

function groupEvents (events) {
  const groups = new Map()
  for (const event of events) groups.set(event.group, [...(groups.get(event.group) ?? []), event])
  return [...groups]
}

function EventGroup ({ name, events, selected, toggleEvents }) {
  const ids = events.map(e => e.id)
  const chosen = ids.filter(id => selected.includes(id)).length

  return (
    <fieldset className='flex flex-col gap-3 not-first:border-t not-first:pt-4'>
      <legend className='sr-only'>{name}</legend>
      <label className='flex cursor-pointer items-center gap-2.5 font-semibold text-sm'>
        <Checkbox
          checked={chosen === ids.length}
          indeterminate={chosen > 0 && chosen < ids.length}
          onCheckedChange={on => toggleEvents(ids, on === true)}
        />
        {name}
      </label>
      {events.map(event => (
        <ChoiceLabel
          key={event.id}
          className='ps-7'
          control={<Checkbox checked={selected.includes(event.id)} onCheckedChange={on => toggleEvents([event.id], on === true)} />}
          title={event.label}
          description={event.description}
        />
      ))}
    </fieldset>
  )
}

export function EventsSection ({ events, selected, toggleEvents }) {
  const groups = useMemo(() => groupEvents(events), [events])

  return (
    <FormSection title='Events' description={`${selected.length} of ${events.length} selected`}>
      {groups.map(([name, list]) => <EventGroup key={name} name={name} events={list} selected={selected} toggleEvents={toggleEvents} />)}
    </FormSection>
  )
}
