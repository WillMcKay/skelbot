import { Panel } from '@/components/panel'

export function FormSection ({ title, description, children }) {
  return (
    <Panel title={title} description={description}>
      <div className='flex flex-col gap-5'>{children}</div>
    </Panel>
  )
}

export function ChoiceLabel ({ control, title, description, className }) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 text-sm ${className ?? ''}`}>
      <span className='pt-0.5'>{control}</span>
      <span className='flex flex-col'>
        <span className='font-medium'>{title}</span>
        {description && <span className='text-muted-foreground text-xs'>{description}</span>}
      </span>
    </label>
  )
}
