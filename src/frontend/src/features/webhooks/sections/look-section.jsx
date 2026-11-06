import { Segmented } from '@/components/segmented'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ChoiceLabel, FormSection } from './form-section'

const STYLES = { embed: 'Embed', text: 'Plain text' }
const COLOR_MODES = { level: 'By severity', fixed: 'One colour' }
const DEFAULT_COLOR = '#2a78d6'

export function LookSection ({ hook, set }) {
  const fixedColor = hook.color !== 'level'

  return (
    <FormSection title='Look'>
      <Field>
        <FieldLabel>Message style</FieldLabel>
        <Segmented label='Message style' value={hook.style} onChange={value => set('style', value)} options={STYLES} />
      </Field>

      <div className='grid gap-4 sm:grid-cols-2'>
        <Field>
          <FieldLabel>Display name (optional)</FieldLabel>
          <Input value={hook.username} onChange={e => set('username', e.target.value)} maxLength={80} placeholder="The webhook's own name" />
        </Field>
        <Field>
          <FieldLabel>Avatar URL (optional)</FieldLabel>
          <Input value={hook.avatarUrl} onChange={e => set('avatarUrl', e.target.value)} placeholder='https://…/avatar.png' spellCheck='false' />
        </Field>
      </div>

      {hook.style === 'embed' && (
        <Field>
          <FieldLabel>Embed colour</FieldLabel>
          <div className='flex items-center gap-3'>
            <Segmented
              label='Embed colour'
              value={fixedColor ? 'fixed' : 'level'}
              onChange={mode => set('color', mode === 'level' ? 'level' : DEFAULT_COLOR)}
              options={COLOR_MODES}
            />
            {fixedColor && (
              <input type='color' value={hook.color} onChange={e => set('color', e.target.value)} aria-label='Embed colour' className='h-9 w-12 cursor-pointer rounded-lg border bg-transparent p-1' />
            )}
          </div>
        </Field>
      )}

      <ChoiceLabel control={<Switch checked={hook.showBotName} onCheckedChange={on => set('showBotName', on)} />} title="Put the bot's name in the title" />
      <ChoiceLabel control={<Switch checked={hook.includeFields} onCheckedChange={on => set('includeFields', on)} />} title='Include details' description='Items sold, balance and so on.' />
    </FormSection>
  )
}
