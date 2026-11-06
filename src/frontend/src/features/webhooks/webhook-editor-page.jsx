import { SendIcon, Trash2Icon, WebhookIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Page, PageHero } from '@/components/page-hero'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useAction } from '@/hooks/use-action'
import { navigate } from '@/hooks/use-hash-route'
import { useLiveData } from '@/hooks/use-live-data'
import { webhooksApi } from '@/lib/api'
import { toast } from '@/lib/toast'
import { BotsSection } from './sections/bots-section'
import { ConnectionSection } from './sections/connection-section'
import { EventsSection } from './sections/events-section'
import { LookSection } from './sections/look-section'
import { MentionsSection } from './sections/mentions-section'
import { useWebhookForm } from './use-webhook-form'
import { settingsOf } from './webhook-model'
import { WebhookPreview } from './webhook-preview'

export function WebhookEditorPage ({ initial }) {
  const { events, botList } = useLiveData()
  const { hook, set, setMention, toggleEvents, toggleBot } = useWebhookForm(initial)
  const { pending, run } = useAction()
  const isNew = !initial.id
  const back = () => navigate('webhooks')

  const save = e => {
    e.preventDefault()
    run('save', async () => {
      const settings = settingsOf(hook)
      if (isNew) await webhooksApi.create(settings)
      else await webhooksApi.update(initial.id, settings)
      toast.success(isNew ? 'Webhook added' : 'Webhook saved')
      back()
    })
  }

  const test = () => run('test', () => webhooksApi.test(settingsOf(hook)), { success: 'Test sent. Check the channel.' })
  const remove = () => run('remove', async () => {
    await webhooksApi.remove(initial.id)
    back()
  })

  return (
    <Page>
      <form onSubmit={save} className='flex flex-col gap-4'>
        <PageHero
          icon={WebhookIcon}
          title={isNew ? 'New webhook' : initial.name}
          description='Choose what this webhook posts, and how it looks.'
          crumbs={[{ label: 'Webhooks', href: '#/webhooks' }, { label: isNew ? 'New' : initial.name }]}
          actions={(
            <label className='flex cursor-pointer items-center gap-2 rounded-full bg-muted py-1 ps-1.5 pe-3 font-medium text-sm'>
              <Switch checked={hook.enabled} onCheckedChange={on => set('enabled', on)} />
              {hook.enabled ? 'Sending' : 'Paused'}
            </label>
          )}
        />

        <div className='grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]'>
          <div className='flex min-w-0 flex-col gap-4'>
            <ConnectionSection name={hook.name} url={hook.url} set={set} />
            <EventsSection events={events} selected={hook.events} toggleEvents={toggleEvents} />
            <BotsSection value={hook.bots} bots={botList} set={set} toggleBot={toggleBot} />
            <MentionsSection mention={hook.mention} setMention={setMention} />
            <LookSection hook={hook} set={set} />
          </div>

          <aside className='flex flex-col gap-3 lg:sticky lg:top-4'>
            <WebhookPreview hook={hook} />
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' className='rounded-full' disabled={!hook.url} loading={pending === 'test'} onClick={test}>
                <SendIcon />Send test
              </Button>
              <Button type='submit' className='rounded-full px-5' loading={pending === 'save'}>{isNew ? 'Add webhook' : 'Save'}</Button>
            </div>
            {!isNew && (
              <ConfirmDialog
                title={`Delete "${initial.name}"?`}
                description='skelbot stops posting to it. The webhook itself stays in Discord.'
                confirmLabel='Delete'
                onConfirm={remove}
                trigger={<Button type='button' variant='ghost' className='self-end rounded-full text-destructive-foreground'><Trash2Icon />Delete webhook</Button>}
              />
            )}
          </aside>
        </div>
      </form>
    </Page>
  )
}
