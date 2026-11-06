import { SendIcon, PlusIcon, WebhookIcon } from 'lucide-react'
import { Page, PageHero } from '@/components/page-hero'
import { Button } from '@/components/ui/button'
import { CardFrame } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Switch } from '@/components/ui/switch'
import { useAction } from '@/hooks/use-action'
import { useLiveData } from '@/hooks/use-live-data'
import { webhooksApi } from '@/lib/api'
import { since } from '@/lib/format'
import { cn } from '@/lib/utils'
import { describe, settingsOf } from './webhook-model'

function AddButton () {
  return <Button size='sm' className='rounded-full' render={<a href='#/webhooks/new' />}><PlusIcon />Add webhook</Button>
}

function NoWebhooks () {
  return (
    <Empty className='rounded-3xl bg-card py-16'>
      <EmptyHeader>
        <EmptyMedia variant='icon'><WebhookIcon /></EmptyMedia>
        <EmptyTitle>No webhooks yet</EmptyTitle>
        <EmptyDescription>
          In Discord, open a channel's settings, go to Integrations → Webhooks → New Webhook, and copy its URL.
          Then add it here to choose what gets posted.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent><AddButton /></EmptyContent>
    </Empty>
  )
}

function DeliveryStatus ({ result }) {
  if (!result) return null

  return (
    <span className={cn('w-fit rounded-md px-1.5 py-0.5 text-xs', result.ok ? 'bg-success text-success-foreground' : 'bg-error text-error-foreground')}>
      {result.ok ? `Last sent ${since(result.at)}` : `Failed ${since(result.at)}: ${result.error}`}
    </span>
  )
}

function WebhookRow ({ hook, summary, action }) {
  const { pending, run } = action

  return (
    <CardFrame className='rounded-2xl'>
      <div className='relative flex flex-wrap items-center gap-4 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-muted'><WebhookIcon className='size-4.5' aria-hidden='true' /></span>
        <a href={`#/webhooks/${hook.id}`} className='flex min-w-0 flex-1 flex-col gap-1'>
          <span className='font-medium'>{hook.name}{!hook.enabled && <span className='text-muted-foreground'> · paused</span>}</span>
          <span className='break-words text-muted-foreground text-sm'>{summary}</span>
          <DeliveryStatus result={hook.lastResult} />
        </a>
        <div className='flex items-center gap-2'>
          <Switch
            checked={hook.enabled}
            disabled={pending === hook.id}
            onCheckedChange={enabled => run(hook.id, () => webhooksApi.update(hook.id, { enabled }))}
            aria-label={`${hook.enabled ? 'Pause' : 'Resume'} ${hook.name}`}
          />
          <Button variant='outline' size='sm' className='rounded-full' loading={pending === `test-${hook.id}`} onClick={() => run(`test-${hook.id}`, () => webhooksApi.test(settingsOf(hook)), { success: 'Test sent' })}>
            <SendIcon />Send test
          </Button>
          <Button variant='ghost' size='sm' className='rounded-full' render={<a href={`#/webhooks/${hook.id}`} />}>Edit</Button>
        </div>
      </div>
    </CardFrame>
  )
}

export function WebhooksPage () {
  const { webhooks, events, botList } = useLiveData()
  const action = useAction()

  return (
    <Page>
      <PageHero
        icon={WebhookIcon}
        title='Webhooks'
        description='Post bot events to Discord. Each webhook picks its own events, bots, mentions and look.'
        crumbs={[{ label: 'skelbot' }, { label: 'Webhooks' }]}
        actions={webhooks.length > 0 && <AddButton />}
      />
      {webhooks.length === 0
        ? <NoWebhooks />
        : (
          <div className='flex flex-col gap-3'>
            {webhooks.map(hook => <WebhookRow key={hook.id} hook={hook} summary={describe(hook, events.length, botList)} action={action} />)}
          </div>
          )}
    </Page>
  )
}
