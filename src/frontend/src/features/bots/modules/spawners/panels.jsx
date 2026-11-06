import { OrdersCard } from '../../orders-card'
import { ProfitChart } from '../../profit-chart'

export function SpawnersPanels ({ state }) {
  return (
    <>
      <OrdersCard orders={state?.orders} />
      <ProfitChart history={state?.history} />
    </>
  )
}
