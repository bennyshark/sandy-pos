import { Suspense } from "react"
import { getInventoryItems } from "@/lib/actions/inventory"
import { Header } from "@/components/layout/header"
import { InventoryClient } from "@/components/inventory/inventory-client"
import { InventoryPageSkeleton } from "@/components/ui/skeletons"

export const metadata = { title: "Inventory" }

async function InventoryData() {
  const items = await getInventoryItems()
  return <InventoryClient initialItems={items as never} />
}

export default function InventoryPage() {
  return (
    <>
      <Header title="Inventory" subtitle="Track and manage stock levels" />
      <div className="flex-1 overflow-y-auto p-5">
        <Suspense fallback={<InventoryPageSkeleton />}>
          <InventoryData />
        </Suspense>
      </div>
    </>
  )
}