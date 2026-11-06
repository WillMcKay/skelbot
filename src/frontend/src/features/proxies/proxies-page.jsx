import { useState } from 'react'
import { GlobeIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Chip, Panel } from '@/components/panel'
import { Page, PageHero } from '@/components/page-hero'
import { Segmented } from '@/components/segmented'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAction } from '@/hooks/use-action'
import { useAnonymous } from '@/hooks/use-anonymous'
import { useLiveData } from '@/hooks/use-live-data'
import { BLURRED_TEXT, MASKED_TEXT } from '@/lib/anonymize'
import { proxiesApi } from '@/lib/api'
import { plural } from '@/lib/format'
import { cn } from '@/lib/utils'

const VIEWS = { list: 'List', bulk: 'Bulk edit' }
const PLACEHOLDER = 'socks5://user:pass@host:port, http://host:port or host:port:user:pass'

function RequireProxy ({ required, action }) {
  return (
    <Panel>
      <label className='flex cursor-pointer items-center justify-between gap-4'>
        <span className='flex flex-col gap-0.5'>
          <span className='font-medium text-sm'>Require a proxy</span>
          <span className='text-muted-foreground text-sm'>When on, bots won’t connect without a working proxy.</span>
        </span>
        <Switch
          checked={required}
          disabled={action.pending === 'required'}
          onCheckedChange={value => action.run('required', () => proxiesApi.update({ required: value }))}
        />
      </label>
    </Panel>
  )
}

function ProxyRow ({ entry, hidden, onRemove, removing }) {
  const label = entry.error ? entry.line : `${entry.type}://${entry.host}:${entry.port}`

  return (
    <li className='flex items-center gap-3 px-4 py-2.5'>
      <span className={cn('size-2 shrink-0 rounded-full', entry.error ? 'bg-destructive' : 'bg-emerald-500')} aria-hidden='true' />
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className={cn('truncate font-mono text-sm', hidden && BLURRED_TEXT)}>{label}</span>
        {entry.error && <span className='text-destructive-foreground text-xs'>{entry.error}</span>}
      </span>
      {entry.auth && <span className='rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground text-xs'>login</span>}
      <Button variant='ghost' size='icon-sm' className='rounded-lg text-muted-foreground' onClick={onRemove} disabled={removing} aria-label='Remove proxy'>
        <Trash2Icon />
      </Button>
    </li>
  )
}

function ListView ({ entries, hidden, save, pending }) {
  const [draft, setDraft] = useState('')
  const lines = entries.map(entry => entry.line)

  const add = async e => {
    e.preventDefault()
    const added = draft.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    if (added.length && await save('add', [...lines, ...added])) setDraft('')
  }

  return (
    <div className='flex flex-col'>
      <form onSubmit={add} className='flex gap-2 border-b p-3'>
        <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder={PLACEHOLDER} className={cn('font-mono', hidden && MASKED_TEXT)} autoComplete='off' aria-label='Proxy to add' />
        <Button type='submit' className='rounded-xl' disabled={!draft.trim()} loading={pending === 'add'}><PlusIcon />Add</Button>
      </form>
      {entries.length === 0
        ? (
          <p className='px-4 py-10 text-center text-muted-foreground text-sm'>No proxies yet.</p>
          )
        : (
          <ul className='max-h-[28rem] divide-y overflow-y-auto'>
            {entries.map((entry, index) => (
              <ProxyRow
                key={`${index}-${entry.line}`}
                entry={entry}
                hidden={hidden}
                removing={pending === `remove-${index}`}
                onRemove={() => save(`remove-${index}`, lines.filter((_, i) => i !== index))}
              />
            ))}
          </ul>
          )}
    </div>
  )
}

function BulkView ({ entries, hidden, save, pending }) {
  const saved = entries.map(entry => entry.line).join('\n')
  const [text, setText] = useState(saved)
  const changed = text.trim() !== saved

  const submit = e => {
    e.preventDefault()
    save('bulk', text.split(/\r?\n/))
  }

  return (
    <form onSubmit={submit} className='flex flex-col gap-3 p-3'>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={14}
        spellCheck={false}
        placeholder={`One proxy per line, e.g.\n${PLACEHOLDER.split(', ').join('\n')}`}
        aria-label='Proxies, one per line'
        className={cn('w-full resize-y rounded-xl border bg-background px-3 py-2.5 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30', hidden && MASKED_TEXT)}
      />
      <div className='flex justify-end gap-2'>
        <Button type='button' variant='ghost' className='rounded-xl' disabled={!changed} onClick={() => setText(saved)}>Reset</Button>
        <Button type='submit' className='rounded-xl px-5' disabled={!changed} loading={pending === 'bulk'}>Save list</Button>
      </div>
    </form>
  )
}

export function ProxiesPage () {
  const { proxies } = useLiveData()
  const { anonymous } = useAnonymous()
  const action = useAction()
  const [view, setView] = useState('list')
  const { entries, required } = proxies
  const invalid = entries.filter(entry => entry.error).length

  const save = (key, lines) => action.run(key, () => proxiesApi.update({ lines }), { success: 'Proxies saved' })

  return (
    <Page>
      <PageHero icon={GlobeIcon} title='Proxies' crumbs={[{ label: 'skelbot' }, { label: 'Proxies' }]} />
      <RequireProxy required={required} action={action} />
      <Panel
        title='Proxy list'
        description='Each bot picks one at random when it connects.'
        flush
        action={(
          <div className='flex items-center gap-2'>
            {invalid > 0 && <Chip className='text-destructive-foreground'>{plural(invalid, 'invalid line')}</Chip>}
            <Chip>{plural(entries.length - invalid, 'proxy', 'proxies')}</Chip>
            <Segmented label='Proxy list view' size='sm' value={view} onChange={setView} options={VIEWS} />
          </div>
        )}
      >
        {view === 'list'
          ? <ListView entries={entries} hidden={anonymous} save={save} pending={action.pending} />
          : <BulkView key={entries.map(entry => entry.line).join('\n')} entries={entries} hidden={anonymous} save={save} pending={action.pending} />}
      </Panel>
    </Page>
  )
}
