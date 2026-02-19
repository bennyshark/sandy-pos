"use client"
import { useState, useTransition } from "react"
import { updateOrderStatus } from "@/lib/actions/orders"
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
  getPaymentIcon,
} from "@/lib/utils"
import { ExternalLink } from "lucide-react"
import type { StoreSettings } from "@/types"

const ALL_STATUSES = [
  "PENDING",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
]

type OrderItem = {
  productName: string
  quantity: number
  subtotal: string
}

type Order = {
  id: string
  orderNumber: string
  status: string
  type: string
  tableNumber: string | null
  customerName: string | null
  subtotal: string
  discountAmount: string
  taxAmount: string
  total: string
  paymentMethod: string | null
  receiptToken: string | null
  createdAt: Date
  items: OrderItem[]
  cashier?: { name: string | null } | null
}

interface OrdersClientProps {
  orders: Order[]
  settings: StoreSettings
}

export function OrdersClient({
  orders: initialOrders,
  settings,
}: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered =
    filterStatus === "ALL"
      ? orders
      : orders.filter((o) => o.status === filterStatus)

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      await updateOrderStatus(id, status)
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      )
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status } : null))
      }
    })
  }

  const typeEmoji = (type: string) => {
    if (type === "DINE_IN") return "🪑"
    if (type === "TAKEOUT") return "🛍️"
    return "🛵"
  }

  return (
    <div className="flex gap-5 h-full overflow-hidden">
      {/* Order list */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4 overflow-hidden">
        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap shrink-0">
          {["ALL", ...ALL_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-muted-foreground border border-border hover:bg-muted"
              }`}
            >
              {s === "ALL" ? "All" : s}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground self-center">
            {filtered.length} orders
          </span>
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-card">
                  {["Order #", "Type", "Status", "Total", "Date", ""].map(
                    (h, i) => (
                      <th
                        key={h || i}
                        className={`px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${
                          i === 0 || i === 1 ? "text-left" : "text-right"
                        } ${i === 3 ? "hidden md:table-cell" : ""}`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-14 text-muted-foreground text-sm"
                    >
                      <p className="text-3xl mb-2">📋</p>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id
                          ? "bg-primary/5 border-l-[3px] border-l-primary"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground text-sm">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-muted-foreground">
                          {typeEmoji(order.type)}{" "}
                          {order.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden md:table-cell">
                        <span className="text-primary font-bold text-sm">
                          {formatCurrency(order.total, settings.currencySymbol)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {order.receiptToken && (
                          <a
                            href={`/receipt/${order.receiptToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors inline-flex"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedOrder && (
        <div className="w-72 bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4 shrink-0 overflow-y-auto">
          <div>
            <h3
              className="font-bold text-foreground text-base"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {selectedOrder.orderNumber}
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              {formatDateTime(selectedOrder.createdAt)}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(selectedOrder.status)}`}
            >
              {selectedOrder.status}
            </span>
            {selectedOrder.paymentMethod && (
              <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                {getPaymentIcon(selectedOrder.paymentMethod)}{" "}
                {selectedOrder.paymentMethod}
              </span>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2 border-t border-border pt-3">
            {selectedOrder.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground text-xs">
                  {item.productName} ×{item.quantity}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatCurrency(item.subtotal, settings.currencySymbol)}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span className="text-foreground text-sm">Total</span>
              <span className="text-primary text-sm">
                {formatCurrency(
                  selectedOrder.total,
                  settings.currencySymbol
                )}
              </span>
            </div>
          </div>

          {/* Update status */}
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Update Status
            </p>
            <div className="flex flex-col gap-1.5">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(selectedOrder.id, s)}
                  disabled={isPending || selectedOrder.status === s}
                  className={`py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedOrder.status === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {selectedOrder.receiptToken && (
            <a
              href={`/receipt/${selectedOrder.receiptToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-muted hover:bg-accent text-foreground rounded-xl text-xs font-medium transition-colors"
            >
              <ExternalLink size={13} />
              Open Receipt
            </a>
          )}
        </div>
      )}
    </div>
  )
}
