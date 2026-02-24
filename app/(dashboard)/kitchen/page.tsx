import { getKitchenOrders } from "@/lib/actions/orders"
import { KitchenClient } from "@/components/kitchen/kitchen-client"

export const metadata = { title: "Kitchen View" }
export const revalidate = 30

export default async function KitchenPage() {
  const kitchenOrders = await getKitchenOrders()

  return (
    <div className="flex flex-col h-full bg-background">
      <KitchenClient orders={kitchenOrders as never} />
    </div>
  )
}