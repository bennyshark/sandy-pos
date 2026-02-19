import { getInventoryItems, getInventoryLogs } from "@/lib/actions/inventory"
import { Header } from "@/components/layout/header"
import { InventoryClient } from "@/components/inventory/inventory-client"

export const metadata = { title: "Inventory" }

export default async function InventoryPage() {
  const [items, logs] = await Promise.all([
    getInventoryItems(),
    getInventoryLogs(),
  ])

  return (
    <>
      <Header
        title="Inventory"
        subtitle="Track and manage stock levels"
      />
      <div className="flex-1 overflow-y-auto p-5">
        <InventoryClient initialItems={items as never} initialLogs={logs as never} />
      </div>
    </>
  )
}
