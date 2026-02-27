import { Suspense } from "react"
import { getKitchenOrders } from "@/lib/actions/orders"
import { KitchenClient } from "@/components/kitchen/kitchen-client"
import { KitchenPageSkeleton } from "@/components/ui/skeletons"

export const metadata = { title: "Kitchen View" }

async function KitchenData() {
  const kitchenOrders = await getKitchenOrders()
  return <KitchenClient orders={kitchenOrders as never} />
}

export default function KitchenPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      <Suspense fallback={<KitchenPageSkeleton />}>
        <KitchenData />
      </Suspense>
    </div>
  )
}