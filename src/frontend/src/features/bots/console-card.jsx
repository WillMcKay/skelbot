import { useEffect, useRef } from 'react'
import { BotIcon } from 'lucide-react'
import { Chip, Panel } from '@/components/panel'
import { clock } from '@/lib/format'

const STREAM_CLASS = {
  err: 'text-destructive',
  warn: 'text-amber-600 dark:text-amber-400',
  manager: 'italic text-muted-foreground'
}

export function ConsoleCard ({ logs, offline }) {
  const box = useRef(null)
  const following = useRef(true)

  useEffect(() => {
    if (box.current && following.current) box.current.scrollTop = box.current.scrollHeight
  }, [logs])

  const onScroll = e => {
    const el = e.currentTarget
    following.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
  }

  return (
    <Panel title='Console' flush action={<Chip>{logs.length} lines</Chip>}>
      <div className='relative'>
        <pre
          ref={box}
          onScroll={onScroll}
          aria-hidden={offline || undefined}
          className={`h-72 overflow-auto rounded-xl bg-muted/45 px-4 py-3 font-mono text-[12.5px] text-foreground leading-relaxed break-words whitespace-pre-wrap ${offline ? 'select-none' : ''}`}
        >
          {logs.map((entry, i) => entry.stream === 'banner'
            ? <div key={i} className={`whitespace-pre font-bold text-primary-strong leading-tight ${logs[i - 1]?.stream === 'banner' ? '' : 'mt-2'}`}>{entry.line}</div>
            : (
              <div key={i} className={STREAM_CLASS[entry.stream]}>
                <span className='text-muted-foreground'>{clock(entry.at)} </span>
                {entry.line}
              </div>
              ))}
        </pre>
        {offline && (
          <div role='status' className='absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-card/50 px-4 text-center backdrop-blur-sm'>
            <span className='grid size-12 place-items-center rounded-2xl bg-card text-muted-foreground shadow-sm'>
              <BotIcon className='size-6' aria-hidden='true' />
            </span>
            <div className='flex flex-col gap-1 '>
              <p className='font-semibold text-sm'>Bot is offline</p>
              <p className='text-muted-foreground text-sm'>Start the bot to see live console output.</p>
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}
