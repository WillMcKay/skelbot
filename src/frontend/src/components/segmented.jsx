import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'

export function Segmented ({ value, onChange, options, label, size = 'default' }) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList size={size} aria-label={label} className='rounded-full'>
        {Object.entries(options).map(([key, text]) => <TabsTab key={key} value={key} className='rounded-full'>{text}</TabsTab>)}
      </TabsList>
    </Tabs>
  )
}
