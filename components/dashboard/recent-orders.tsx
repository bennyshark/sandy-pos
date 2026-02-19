import { formatCurrency, formatTime, getStatusColor } from "@/lib/utils"
import Link from "next/link"
import type { StoreSettings } from "@/types"

interface RecentOrdersProps {
  orders: {
    id: string
    orderNumber: string
    status: string
    total: string
    type: string
    createdAt: Date
    items: { productName: string; quantity: number }[]
  }[]
  settings: StoreSettings
}

export function RecentOrders({ orders, settings }: RecentOrdersProps) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm">
          Recent Orders
        </h3>
        <Link
          href="/orders"
          className="text-primary text-xs hover:underline font-medium"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-2.5">
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No orders yet
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-foreground text-sm">
                    {order.orderNumber}
                  </p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {order.items
                    .map((i) => `${i.productName} ×${i.quantity}`)
                    .join(", ")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-primary font-bold text-sm">
                  {formatCurrency(order.total, settings.currencySymbol)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatTime(order.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
