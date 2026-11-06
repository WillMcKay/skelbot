import { Segmented } from '@/components/segmented'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MENTIONS, needsMentionId } from '../webhook-model'
import { FormSection } from './form-section'

const WHEN = { alerts: 'Only on alerts', all: 'On every message' }
const MENTION_ITEMS = Object.entries(MENTIONS).map(([value, label]) => ({ value, label }))

export function MentionsSection ({ mention, setMention }) {
  const needsId = needsMentionId(mention.type)

  return (
    <FormSection title='Mentions'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Field>
          <FieldLabel>Mention</FieldLabel>
          <Select items={MENTION_ITEMS} value={mention.type} onValueChange={value => setMention('type', value)}>
            <SelectTrigger className='w-full'><SelectValue /></SelectTrigger>
            <SelectPopup>
              {MENTION_ITEMS.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectPopup>
          </Select>
        </Field>
        {needsId && (
          <Field>
            <FieldLabel>{mention.type === 'role' ? 'Role' : 'User'} ID</FieldLabel>
            <Input value={mention.id} onChange={e => setMention('id', e.target.value.trim())} inputMode='numeric' placeholder='123456789012345678' required />
          </Field>
        )}
      </div>
      {needsId && <FieldDescription>In Discord, turn on Developer Mode (Settings → Advanced), then right-click the {mention.type} → Copy ID.</FieldDescription>}
      {mention.type !== 'none' && <Segmented label='When to mention' value={mention.on} onChange={value => setMention('on', value)} options={WHEN} />}
    </FormSection>
  )
}
