import { Panel } from '@/components/panel'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { count, price } from '@/lib/format'

const COLUMNS = [
  ['Carrying', o => o.inInventory == null ? '—' : count(o.inInventory)],
  ['Sold today', o => o.soldToday == null ? '—' : count(o.soldToday)],
  ['Sold all time', o => o.sold == null ? '—' : count(o.sold)],
  ['Avg price', o => o.averagePrice == null ? '—' : price(o.averagePrice)],
  ['Per hour', o => o.perHour == null ? '—' : count(o.perHour)]
]

export function OrdersCard ({ orders }) {
  return (
    <Panel title='Orders' flush className='@container'>
      {orders
        ? (
          <>
            <ul className='flex flex-col divide-y @xl:hidden'>
              {orders.map(order => (
                <li key={order.item} className='flex flex-col gap-2 px-4 py-3'>
                  <span className='font-medium text-sm'>{order.label}s</span>
                  <dl className='grid grid-cols-3 gap-x-3 gap-y-2 @sm:grid-cols-5'>
                    {COLUMNS.map(([label, value]) => (
                      <div key={label} className='flex min-w-0 flex-col'>
                        <dt className='truncate text-muted-foreground text-xs'>{label}</dt>
                        <dd className='text-sm tabular-nums'>{value(order)}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
            <div className='hidden @xl:block'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='ps-4'>Item</TableHead>
                    {COLUMNS.map(([label]) => <TableHead key={label} className='text-right last:pe-4'>{label}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.item}>
                      <TableCell className='ps-4 font-medium'>{order.label}s</TableCell>
                      {COLUMNS.map(([label, value]) => <TableCell key={label} className='text-right tabular-nums last:pe-4'>{value(order)}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
          )
        : (
          <div role='status' aria-label='Loading orders' className='flex flex-col gap-3 p-4'>
            {Array.from({ length: 2 }, (_, row) => (
              <div key={row} className='flex items-center justify-between gap-3' aria-hidden='true'>
                {Array.from({ length: 6 }, (_, column) => <Skeleton key={column} className={`h-4 ${column === 0 ? 'w-14' : 'w-10'}`} />)}
              </div>
            ))}
            <span className='sr-only'>Loading orders…</span>
          </div>
          )}
    </Panel>
  )
}
