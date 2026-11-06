import { useState } from 'react'
import { Panel } from '@/components/panel'
import { Segmented } from '@/components/segmented'
import { previewOf, SAMPLES } from './webhook-model'

const SAMPLE_LABELS = Object.fromEntries(Object.entries(SAMPLES).map(([key, s]) => [key, s.label]))

function Mention ({ children }) {
  return <span className='rounded-sm bg-[#5865f2]/30 px-0.5 font-medium text-[#c9cdfb]'>{children}</span>
}

function Fields ({ fields, inline }) {
  if (inline) return <p>{fields.map(([k, v], i) => <span key={k}>{i > 0 && ' · '}{k}: <strong>{v}</strong></span>)}</p>

  return (
    <dl className='grid grid-cols-3 gap-2 text-[13px]'>
      {fields.map(([k, v]) => <div key={k}><dt className='font-semibold text-[#f2f3f5]'>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  )
}

function DiscordMessage ({ message: m }) {
  return (
    <div className='flex gap-3 rounded-xl bg-[#313338] p-3.5 text-[#dbdee1] text-sm leading-snug' aria-label='Preview of the Discord message'>
      <div className='grid size-10 flex-none place-items-center overflow-hidden rounded-full bg-[#1e1f22]'>
        {m.avatarUrl ? <img src={m.avatarUrl} alt='' className='size-full object-cover' /> : <span className='size-5 rounded-md bg-chart-1' />}
      </div>
      <div className='flex min-w-0 flex-1 flex-col gap-1 break-words'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <strong className='font-semibold text-[#f2f3f5]'>{m.name}</strong>
          <span className='rounded-sm bg-[#5865f2] px-1 font-bold text-[10px] text-white leading-4'>APP</span>
          <span className='text-[#949ba4] text-xs'>Today at 14:02</span>
        </div>

        {m.mention && <p><Mention>{m.mention}</Mention></p>}

        {m.asEmbed
          ? (
            <div className='flex flex-col gap-1.5 rounded border-l-4 bg-[#2b2d31] px-3 pt-2 pb-3' style={{ borderLeftColor: m.color }}>
              <strong className='text-[#f2f3f5] text-[15px]'>{m.title}</strong>
              {m.description && <p className='text-[13.5px]'>{m.description}</p>}
              {m.fields.length > 0 && <Fields fields={m.fields} />}
            </div>
            )
          : (
            <div className='flex flex-col gap-0.5'>
              <p><strong>{m.title}</strong></p>
              {m.description && <p>{m.description}</p>}
              {m.fields.length > 0 && <Fields fields={m.fields} inline />}
            </div>
            )}
      </div>
    </div>
  )
}

export function WebhookPreview ({ hook }) {
  const [sample, setSample] = useState('alert')

  return (
    <Panel title='Preview' action={<Segmented label='Example message' size='sm' value={sample} onChange={setSample} options={SAMPLE_LABELS} />}>
      <DiscordMessage message={previewOf(hook, SAMPLES[sample])} />
    </Panel>
  )
}
