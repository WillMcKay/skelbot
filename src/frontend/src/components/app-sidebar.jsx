import { Squishmoji } from '@usespaceui/squishmoji/react'
import {
  HouseIcon,
  GlobeIcon,
  HatGlassesIcon,
  PlusIcon,
  BotIcon,
  WebhookIcon
} from 'lucide-react'
import { AlertsPopover } from '@/components/alerts-popover'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { Switch } from '@/components/ui/switch'
import { useAnonymous } from '@/hooks/use-anonymous'
import { useLiveData } from '@/hooks/use-live-data'
import { DitherGradient } from '@/components/dither-kit/gradient'
import { shortMoney } from '@/lib/format'
import { BotHead } from '@/features/bots/bot-head'
import { botHref, isOnline, statusOf, totals } from '@/features/bots/bot-model'

function Brand () {
  return (
    <div className='flex items-center justify-between gap-2 pe-1'>
      <a href='#/' className='flex items-center gap-1 px-2 py-1 font-semibold text-xl tracking-tight'>
        <span aria-hidden='true' className=' inline-flex size-12 shrink-0'>
          <Squishmoji
            seed='Daniel Jalkut'
            shape='hexagon'
            expression='neutral'
            size={42}
            backgroundStyle='celaeno'
            animWobble
            animOnHover
            animOnClick
          />
        </span>
        skelbot
      </a>
      <AlertsPopover />
    </div>
  )
}

function SummaryStat ({ label, value }) {
  return (
    <div className='min-w-0 px-2 first:ps-0 last:pe-0'>
      <p className='truncate text-muted-foreground text-[11px]'>{label}</p>
      <p className='mt-0.5 truncate font-semibold text-sm tabular-nums'>{value}</p>
    </div>
  )
}

function PortfolioSummary ({ bots, loaded }) {
  const stats = totals(bots)
  const running = bots.filter(bot => bot.status === 'running').length

  return (
    <section aria-label='User summary' className='relative isolate overflow-hidden rounded-2xl bg-card p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)]'>
      <DitherGradient from='primary' to='transparent' direction='down' cell={3} opacity={0.08} className='z-0' />
      <div className='relative z-10'>
        <div className='flex items-center gap-2'>
          <span className='grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground' aria-hidden='true'>
            <BotIcon className='size-4' />
          </span>
          <p className='min-w-0 flex-1 truncate font-semibold text-sm'>User</p>
          <span
            aria-label={loaded ? `${running} of ${bots.length} bots running` : 'Loading bot status'}
            className='inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs tabular-nums'
          >
            <span className={`size-1.5 rounded-full ${running > 0 ? 'bg-green-500' : 'bg-muted-foreground/50'}`} aria-hidden='true' />
            {loaded ? `${running}/${bots.length} running` : 'Loading…'}
          </span>
        </div>
        <div className='mt-2.5 grid grid-cols-3 divide-x border-t border-border/70 pt-2.5'>
          <SummaryStat label='Last 24h' value={loaded ? shortMoney(stats.last24h) : '—'} />
          <SummaryStat label='Per hour' value={loaded ? shortMoney(stats.perHour) : '—'} />
          <SummaryStat label='All time' value={loaded ? shortMoney(stats.allTime) : '—'} />
        </div>
      </div>
    </section>
  )
}

function NavLink ({ href, active, icon: Icon, children }) {
  return (
    <SidebarMenuButton isActive={active} render={<a href={href} />}>
      {Icon && <Icon aria-hidden='true' />}
      {children}
    </SidebarMenuButton>
  )
}

function AnonymousToggle () {
  const { anonymous, setAnonymous } = useAnonymous()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton render={<label />} className='cursor-pointer justify-between'>
          <span className='flex items-center gap-2'>
            <HatGlassesIcon className='size-4.5' aria-hidden='true' />
            Anonymous mode
          </span>
          <Switch checked={anonymous} onCheckedChange={setAnonymous} aria-label='Anonymous mode' />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function BuildCommit () {
  const { commit } = useLiveData()

  if (!commit) return null

  return <p className='px-2 font-mono text-[11px] text-muted-foreground'>{commit.slice(0, 7)}</p>
}

function Footer () {
  return (
    <SidebarFooter>
      <AnonymousToggle />
      <BuildCommit />
    </SidebarFooter>
  )
}

export function AppSidebar ({ route }) {
  const { botList, loaded, webhooks, proxies } = useLiveData()
  const sending = webhooks.filter(hook => hook.enabled).length
  const usableProxies = proxies.entries.filter(entry => !entry.error).length

  return (
    <Sidebar variant='inset'>
      <SidebarHeader className='gap-3'>
        <Brand />
        <PortfolioSummary bots={botList} loaded={loaded} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='text-[13px]'>Bots</SidebarGroupLabel>
          <SidebarGroupAction render={<a href='#/bots/new' />} title='Add bot'>
            <PlusIcon /><span className='sr-only'>Add bot</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLink href='#/' active={route.page === 'overview'} icon={HouseIcon}>All bots</NavLink>
              </SidebarMenuItem>
              {botList.map(bot => (
                <SidebarMenuItem key={bot.id}>
                  <SidebarMenuButton isActive={route.page === 'bot' && route.id === bot.id} render={<a href={botHref(bot.id)} />}>
                    <BotHead name={bot.name} className='size-4.5' />
                    <span>{bot.name}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>
                    <span className={`size-2 rounded-full ${isOnline(bot) ? 'bg-green-500' : bot.auth ? 'bg-amber-500' : 'bg-zinc-300'}`} aria-label={statusOf(bot).label} />
                  </SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className='text-[13px]'>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLink href='#/webhooks' active={route.page === 'webhooks' || route.page === 'webhook'} icon={WebhookIcon}>Webhooks</NavLink>
                {webhooks.length > 0 && <SidebarMenuBadge>{sending}/{webhooks.length}</SidebarMenuBadge>}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavLink href='#/proxies' active={route.page === 'proxies'} icon={GlobeIcon}>Proxies</NavLink>
                {usableProxies > 0 && <SidebarMenuBadge>{usableProxies}</SidebarMenuBadge>}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Footer />
    </Sidebar>
  )
}
