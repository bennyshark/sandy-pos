import { getOrders } from "@/lib/actions/orders"
import { KitchenClient } from "@/components/kitchen/kitchen-client"

export const metadata = { title: "Kitchen View" }

// Auto-refresh every 30s via revalidation
export const revalidate = 30

export default async function KitchenPage() {
  // Only fetch active (non-completed, non-cancelled) orders for kitchen
  const allOrders = await getOrders(200)
  const kitchenOrders = ((allOrders as never[]) ?? []).filter(
    (o: any) => !["COMPLETED", "CANCELLED"].includes(o.status)
  )

  return (
    <div className="flex flex-col h-full bg-background">
      <KitchenClient orders={kitchenOrders as never} />
    </div>
  )
}