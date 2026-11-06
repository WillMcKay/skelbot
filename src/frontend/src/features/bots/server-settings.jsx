import { Input } from '@/components/ui/input'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLiveData } from '@/hooks/use-live-data'
import { cn } from '@/lib/utils'

const HOST = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/

export const NEW_SERVER = { host: 'donutsmp.net', port: '25565', version: '1.21.11' }

export function serverFrom (bot) {
  return {
    host: bot.serverHost ?? NEW_SERVER.host,
    port: String(bot.serverPort ?? NEW_SERVER.port),
    version: bot.serverVersion ?? NEW_SERVER.version
  }
}

export function serverRequest ({ host, port, version }) {
  return { serverHost: host.trim(), serverPort: Number(port), serverVersion: version.trim() }
}

export function serverProblem ({ host, port, version }) {
  if (!HOST.test(host.trim())) return 'Enter an address like donutsmp.net'
  const number = Number(port)
  if (!port || !Number.isInteger(number) || number < 1 || number > 65535) return 'Port must be between 1 and 65535'
  if (!version) return 'Choose a version'
  return null
}

function VersionName ({ version, recommended }) {
  return (
    <span className='flex items-center gap-2'>
      {version}
      {version === recommended && <span className='rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] text-primary-strong leading-none'>Recommended</span>}
    </span>
  )
}

function VersionSelect ({ value, onChange }) {
  const { versions } = useLiveData()
  const { supported, recommended } = versions

  return (
    <div className='flex flex-col gap-1.5 text-sm'>
      <span id='bot-version-label' className='text-muted-foreground'>Version</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-labelledby='bot-version-label' className='min-h-10 rounded-xl'>
          <SelectValue>{version => <VersionName version={version} recommended={recommended} />}</SelectValue>
        </SelectTrigger>
        <SelectPopup>
          {supported.map(version => (
            <SelectItem key={version} value={version}>
              <VersionName version={version} recommended={recommended} />
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  )
}

export function ServerFields ({ value, onChange }) {
  const set = change => onChange({ ...value, ...change })
  const problem = serverProblem(value)

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1.5 text-sm'>
        <span className='text-muted-foreground'>Server</span>
        <div className='flex gap-2'>
          <Input value={value.host} onChange={e => set({ host: e.target.value })} placeholder='donutsmp.net' autoComplete='off' spellCheck={false} aria-label='Server address' className='min-w-0 flex-1' />
          <Input value={value.port} onChange={e => set({ port: e.target.value.replace(/\D/g, '') })} inputMode='numeric' placeholder='25565' autoComplete='off' aria-label='Server port' className='w-24 shrink-0' />
        </div>
      </div>
      <VersionSelect value={value.version} onChange={version => set({ version })} />
      <p className={cn('text-warning-foreground text-xs', !problem && 'invisible')} aria-live='polite'>{problem ?? 'Valid'}</p>
    </div>
  )
}
