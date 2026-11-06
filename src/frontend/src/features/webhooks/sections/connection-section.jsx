import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { FormSection } from './form-section'

export function ConnectionSection ({ name, url, set }) {
  return (
    <FormSection title='Connection'>
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input value={name} onChange={e => set('name', e.target.value)} maxLength={64} placeholder='e.g. Alerts channel' />
      </Field>
      <Field>
        <FieldLabel>Webhook URL</FieldLabel>
        <Input value={url} onChange={e => set('url', e.target.value)} required placeholder='https://discord.com/api/webhooks/…' autoComplete='off' spellCheck='false' />
        <FieldDescription>Channel settings → Integrations → Webhooks → Copy Webhook URL. Anyone with this URL can post to the channel.</FieldDescription>
      </Field>
    </FormSection>
  )
}
