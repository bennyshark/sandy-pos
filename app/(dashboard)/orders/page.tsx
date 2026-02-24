import { getOrders } from "@/lib/actions/orders"
import { getStoreSettings } from "@/lib/actions/settings"
import { Header } from "@/components/layout/header"
import { OrdersClient } from "@/components/orders/orders-client"

export const metadata = { title: "Orders" }

export default async function OrdersPage() {
  const [orders, settings] = await Promise.all([
    getOrders(100),
    getStoreSettings(),
  ])

  return (
    <>
      <Header title="Orders" subtitle="View and manage all orders" />
      <div className="flex-1 overflow-hidden p-5">
        <OrdersClient orders={orders as never} settings={settings as never} />
      </div>
    </>
  )
}