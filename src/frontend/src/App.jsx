import { AppSidebar } from '@/components/app-sidebar'
import { DitherGradient } from '@/components/dither-kit/gradient'
import { CrashNotice, ErrorBoundary } from '@/components/error-boundary'
import { Page } from '@/components/page-hero'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAlerts } from '@/hooks/use-alerts'
import { useHashRoute } from '@/hooks/use-hash-route'
import { useLiveData } from '@/hooks/use-live-data'
import { AddBotDialog } from '@/features/bots/add-bot-dialog'
import { EditBotDialog } from '@/features/bots/edit-bot-dialog'
import { BotPage } from '@/features/bots/bot-page'
import { OverviewPage } from '@/features/bots/overview-page'
import { WebhookEditorPage } from '@/features/webhooks/webhook-editor-page'
import { newWebhook } from '@/features/webhooks/webhook-model'
import { WebhooksPage } from '@/features/webhooks/webhooks-page'
import { ProxiesPage } from '@/features/proxies/proxies-page'
import { matchRoute } from './routes'

function Loading () {
  return (
    <Page>
      <Skeleton className='h-36 rounded-3xl' />
      <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>{[0, 1, 2, 3].map(i => <Skeleton key={i} className='h-24 rounded-2xl' />)}</div>
      <Skeleton className='h-64 rounded-2xl' />
    </Page>
  )
}

function NotFound ({ what, href, label }) {
  return (
    <Page>
      <Empty className='rounded-3xl bg-card py-16'>
        <EmptyHeader><EmptyTitle>That {what} no longer exists</EmptyTitle></EmptyHeader>
        <EmptyContent><Button variant='outline' className='rounded-full' render={<a href={href} />}>{label}</Button></EmptyContent>
      </Empty>
    </Page>
  )
}

function PageCrashed ({ error, reset }) {
  return (
    <Page>
      <CrashNotice title='This page hit an error' error={error}>
        <Button className='rounded-full' onClick={reset}>Try again</Button>
      </CrashNotice>
    </Page>
  )
}

function ConnectionLost () {
  const { connected } = useLiveData()
  if (connected) return null

  return (
    <div className='mx-auto w-full max-w-6xl px-3 pt-3 sm:px-5 sm:pt-5'>
      <Alert variant='warning'>
        <AlertTitle>Can't reach the skelbot server</AlertTitle>
        <AlertDescription>What's on screen may be out of date.</AlertDescription>
        <AlertAction>
          <Button size='sm' variant='outline' className='rounded-full' onClick={() => window.location.reload()}>Reload</Button>
        </AlertAction>
      </Alert>
    </div>
  )
}

function CurrentPage ({ route }) {
  const { loaded, bots, rawBots, botList, webhooks, events } = useLiveData()
  if (!loaded) return <Loading />

  switch (route.page) {
    case 'bot': {
      const bot = bots[route.id]
      if (!bot) return <NotFound what='bot' href='#/' label='All bots' />
      return (
        <>
          <BotPage key={bot.id} bot={bot} />
          {route.dialog === 'edit-bot' && <EditBotDialog key={`settings-${bot.id}`} bot={bot} rawBot={rawBots[bot.id]} />}
        </>
      )
    }
    case 'webhooks':
      return <WebhooksPage />
    case 'proxies':
      return <ProxiesPage />
    case 'webhook': {
      const initial = route.id === 'new' ? newWebhook(events) : webhooks.find(h => h.id === route.id)
      return initial ? <WebhookEditorPage key={route.id} initial={initial} /> : <NotFound what='webhook' href='#/webhooks' label='Webhooks' />
    }
    default:
      return (
        <>
          <OverviewPage bots={botList} />
          {route.dialog === 'new-bot' && <AddBotDialog />}
        </>
      )
  }
}

export function App () {
  const path = useHashRoute()
  const route = matchRoute(path)
  useAlerts()

  return (
    <SidebarProvider>
      <AppSidebar route={route} />
      <SidebarInset className='min-w-0 overflow-hidden md:rounded-xl md:shadow-[0_1px_3px_rgb(0_0_0/0.05)]'>
        <header className='flex h-12 items-center gap-2 border-b px-3 md:hidden'>
          <SidebarTrigger />
          <span className='font-semibold'>skelbot</span>
        </header>
        <div className='relative isolate min-w-0 flex-1'>
          <div className='pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 overflow-hidden' aria-hidden='true'>
            <DitherGradient from='primary' direction='down' cell={3} opacity={0.07} />
          </div>
          <ConnectionLost />
          <ErrorBoundary resetKey={path} fallback={props => <PageCrashed {...props} />}>
            <CurrentPage route={route} />
          </ErrorBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
