import { BotHead } from '@/features/bots/bot-head'
import { Checkbox } from '@/components/ui/checkbox'
import { Radio, RadioGroup } from '@/components/ui/radio-group'
import { ChoiceLabel, FormSection } from './form-section'

export function BotsSection ({ value, bots, set, toggleBot }) {
  const all = value === 'all'

  return (
    <FormSection title='Bots'>
      <RadioGroup value={all ? 'all' : 'some'} onValueChange={choice => set('bots', choice === 'all' ? 'all' : bots.map(b => b.id))} className='gap-3'>
        <ChoiceLabel control={<Radio value='all' />} title='All bots' description='Including ones added later.' />
        <ChoiceLabel control={<Radio value='some' />} title='Only these bots' />
      </RadioGroup>

      {!all && (
        <div className='flex flex-wrap gap-2 ps-7'>
          {bots.length === 0 && <p className='text-muted-foreground text-sm'>No bots yet.</p>}
          {bots.map(bot => (
            <label key={bot.id} className='flex cursor-pointer items-center gap-2 rounded-full border bg-card py-1 ps-1.5 pe-3 text-sm has-data-checked:border-primary/40 has-data-checked:bg-muted'>
              <Checkbox checked={value.includes(bot.id)} onCheckedChange={on => toggleBot(bot.id, on === true)} className='sr-only' />
              <BotHead name={bot.name} className='size-6 text-muted-foreground' />
              {bot.name}
            </label>
          ))}
        </div>
      )}
    </FormSection>
  )
}
