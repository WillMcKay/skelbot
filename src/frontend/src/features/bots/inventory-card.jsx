import { useEffect, useState } from 'react'
import { AppleIcon, HeartIcon } from 'lucide-react'
import { Chip, Panel } from '@/components/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { count } from '@/lib/format'
import { INVENTORY_SLOTS } from './bot-model'
import { itemIcon, loadMinecraftItemIcons } from './minecraft-item-icons'

function InventorySlot ({ item, icons }) {
  const icon = itemIcon(icons, item)
  const [failedIcon, setFailedIcon] = useState(null)
  const showIcon = icon && failedIcon !== icon

  return (
    <div
      className='relative flex aspect-square min-w-0 items-center justify-center rounded-md bg-muted/70 ring-1 ring-inset ring-border/70 transition-colors hover:bg-muted'
      title={item ? `${item.name} × ${count(item.count)}` : 'Empty slot'}
      role={item ? 'img' : undefined}
      aria-label={item ? `${item.name}, ${count(item.count)}` : undefined}
      aria-hidden={item ? undefined : 'true'}
    >
      {item && (showIcon
        ? <img src={icon} alt='' className='size-full object-contain p-1 [image-rendering:pixelated]' loading='lazy' onError={() => setFailedIcon(icon)} />
        : <span className='max-h-full overflow-hidden px-0.5 text-center text-[8px] leading-tight text-muted-foreground'>{item.name}</span>)}
      {item && item.count > 1 && (
        <span className='absolute right-0.5 bottom-0.5 rounded-sm bg-black/65 px-0.5 font-mono text-[10px] leading-3 text-white [text-shadow:0_1px_2px_black]'>
          {count(item.count)}
        </span>
      )}
    </div>
  )
}

const MAX_VITAL = 20

function VitalBar ({ icon: Icon, label, value, barClass }) {
  const known = Number.isFinite(value)
  const shown = known ? Math.round(value) : null
  const percent = known ? Math.max(0, Math.min(100, (value / MAX_VITAL) * 100)) : 0
  const low = known && value <= 6

  return (
    <div
      className='flex min-w-0 items-center gap-1.5'
      role='meter'
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={MAX_VITAL}
      aria-valuenow={shown ?? undefined}
      title={known ? `${label} ${shown}/${MAX_VITAL}` : `${label} unknown`}
    >
      <Icon className={`size-3.5 shrink-0 ${low ? 'text-destructive' : 'text-muted-foreground'}`} aria-hidden='true' />
      <div className='h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted'>
        <div className={`h-full rounded-full transition-[width] duration-500 ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
      <span className={`w-5 shrink-0 text-right text-xs tabular-nums ${low ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>{shown ?? '—'}</span>
    </div>
  )
}

function Vitals ({ health, food }) {
  return (
    <div className='grid grid-cols-2 gap-4'>
      <VitalBar icon={HeartIcon} label='Health' value={health} barClass='bg-red-500' />
      <VitalBar icon={AppleIcon} label='Food' value={food} barClass='bg-amber-500' />
    </div>
  )
}

function InventoryGrid ({ slots, icons, vitals }) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='grid grid-cols-9 gap-1.5 sm:gap-2'>
        {slots.slice(0, 27).map((item, index) => <InventorySlot key={index} item={item} icons={icons} />)}
      </div>
      <div className='flex flex-col gap-3 border-t pt-3'>
        {vitals && <Vitals {...vitals} />}
        <div className='grid grid-cols-9 gap-1.5 sm:gap-2'>
          {slots.slice(27, INVENTORY_SLOTS).map((item, index) => <InventorySlot key={index + 27} item={item} icons={icons} />)}
        </div>
      </div>
    </div>
  )
}

function InventorySkeleton () {
  return (
    <div role='status' aria-label='Loading inventory' className='flex flex-col gap-3'>
      <div className='grid grid-cols-9 gap-1.5 sm:gap-2'>
        {Array.from({ length: 27 }, (_, index) => <Skeleton key={index} className='aspect-square rounded-md' />)}
      </div>
      <div className='border-t pt-3'>
        <div className='grid grid-cols-9 gap-1.5 sm:gap-2'>
          {Array.from({ length: 9 }, (_, index) => <Skeleton key={index} className='aspect-square rounded-md' />)}
        </div>
      </div>
      <span className='sr-only'>Loading inventory slots…</span>
    </div>
  )
}

export function InventoryCard ({ slots, connected, health, food }) {
  const [icons, setIcons] = useState(null)
  const [iconError, setIconError] = useState(null)
  const [retry, setRetry] = useState(0)
  const available = connected && Array.isArray(slots)
  const hasItems = available && slots.some(Boolean)
  const used = available ? slots.filter(Boolean).length : 0

  useEffect(() => {
    if (!hasItems) return

    let active = true
    loadMinecraftItemIcons()
      .then(result => {
        if (active) {
          setIcons(result)
          setIconError(null)
        }
      })
      .catch(error => {
        if (active) setIconError(error.message)
      })

    return () => { active = false }
  }, [hasItems, retry])

  return (
    <Panel title='Inventory' action={<Chip>{available ? `${used}/${INVENTORY_SLOTS} slots` : 'Loading slots'}</Chip>}>
      <div className='flex flex-col gap-4'>
        {available
          ? (
            <>
              <InventoryGrid slots={slots} icons={icons} vitals={{ health, food }} />
              {hasItems && !icons && !iconError && <Skeleton className='h-3 w-36' aria-label='Loading item icons' />}
              {iconError && (
                <p role='status' className='text-muted-foreground text-xs'>
                  Item icons unavailable: {iconError} <button type='button' className='font-medium text-foreground underline underline-offset-2' onClick={() => setRetry(value => value + 1)}>Retry</button>
                </p>
              )}
            </>
            )
          : (
            <InventorySkeleton />
            )}
      </div>
    </Panel>
  )
}
