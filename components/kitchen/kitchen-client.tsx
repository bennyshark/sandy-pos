"use client"
import { useState, useTransition, useEffect } from "react"
import { updateOrderStatus } from "@/lib/actions/orders"
import { ChefHat, Clock, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

type OrderItem = {
  productName: string
  quantity: number
  subtotal: string
  notes?: string | null
}

type KitchenOrder = {
  id: string
  orderNumber: string
  status: "PENDING" | "PREPARING" | "READY"
  type: string
  tableNumber: string | null
  customerName: string | null
  createdAt: Date
  items: OrderItem[]
}

interface KitchenClientProps {
  orders: KitchenOrder[]
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    emoji: "🕐",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    header: "bg-yellow-500",
    next: "PREPARING" as const,
    prev: null,
  },
  PREPARING: {
    label: "Preparing",
    emoji: "👨‍🍳",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    header: "bg-blue-500",
    next: "READY" as const,
    prev: "PENDING" as const,
  },
  READY: {
    label: "Ready",
    emoji: "✅",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    header: "bg-green-500",
    next: null,
    prev: "PREPARING" as const,
  },
}

function elapsed(date: Date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h`
}

function isUrgent(date: Date, status: string) {
  const mins = (Date.now() - new Date(date).getTime()) / 60000
  if (status === "PENDING") return mins > 5
  if (status === "PREPARING") return mins > 20
  return false
}

function typeLabel(type: string) {
  if (type === "DINE_IN") return { label: "Dine In", icon: "🪑" }
  if (type === "TAKEOUT") return { label: "Takeout", icon: "🛍️" }
  return { label: "Delivery", icon: "🛵" }
}

function KitchenCard({
  order,
  onStatusChange,
  isPending,
  checked,
  onToggleCheck,
}: {
  order: KitchenOrder
  onStatusChange: (id: string, status: string) => void
  isPending: boolean
  checked: Record<number, boolean>
  onToggleCheck: (index: number) => void
}) {
  const config = STATUS_CONFIG[order.status]
  const urgent = isUrgent(order.createdAt, order.status)
  const t = typeLabel(order.type)
  const showCheckboxes = order.items.length >= 2
  const allChecked = showCheckboxes && order.items.every((_, i) => checked[i])

  return (
    <div
      className={`
        rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-200
        ${config.border} ${urgent ? "ring-2 ring-red-400 ring-offset-1" : ""}
      `}
    >
      {/* Card header */}
      <div className={`${config.header} px-4 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">{order.orderNumber}</span>
          {order.tableNumber && (
            <span className="bg-white/25 text-white text-xs px-2 py-0.5 rounded-full">
              Table {order.tableNumber}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base">{t.icon}</span>
          {showCheckboxes && (
            <span className="bg-white/25 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              {Object.values(checked).filter(Boolean).length}/{order.items.length}
            </span>
          )}
          <span
            className={`
              flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
              ${urgent ? "bg-red-500 text-white animate-pulse" : "bg-white/25 text-white"}
            `}
          >
            <Clock size={10} />
            {elapsed(order.createdAt)}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className={`${config.bg} px-4 py-3 space-y-2`}>
        {order.customerName && (
          <p className="text-xs text-muted-foreground font-medium">👤 {order.customerName}</p>
        )}
        <ul className="space-y-1.5">
          {order.items.map((item, i) => (
            <li
              key={i}
              className={`flex items-start gap-2 transition-opacity ${
                showCheckboxes && checked[i] ? "opacity-40" : ""
              }`}
            >
              {showCheckboxes ? (
                <button
                  onClick={() => onToggleCheck(i)}
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    checked[i]
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-foreground/30 bg-background hover:border-green-400"
                  }`}
                >
                  {checked[i] && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ) : (
                <span className="mt-0.5 w-5 h-5 rounded-md bg-foreground/10 text-foreground text-xs flex items-center justify-center font-bold shrink-0">
                  {item.quantity}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-tight ${checked[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {showCheckboxes && (
                    <span className="font-bold text-foreground/60 mr-1">×{item.quantity}</span>
                  )}
                  {item.productName}
                </p>
                {item.notes && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">📝 {item.notes}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {/* All items done nudge */}
        {showCheckboxes && allChecked && (
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold text-center pt-1">
            ✓ All items ready — move to Ready!
          </p>
        )}
      </div>

      {/* Actions */}
      <div className={`${config.bg} border-t ${config.border} px-3 py-2.5 flex items-center gap-2`}>
        {/* Back */}
        {config.prev ? (
          <button
            onClick={() => onStatusChange(order.id, config.prev!)}
            disabled={isPending}
            title={`Move back to ${config.prev}`}
            className="p-2 rounded-xl bg-background border border-border hover:bg-muted transition-colors disabled:opacity-50 shrink-0"
          >
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
        ) : (
          <div className="w-9 shrink-0" />
        )}

        {/* Status label / Complete button */}
        {order.status === "READY" ? (
          <button
            onClick={() => onStatusChange(order.id, "COMPLETED")}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.97] disabled:opacity-50 shadow-sm"
          >
            <CheckCircle2 size={13} />
            Complete Order
          </button>
        ) : (
          <div className="flex-1 text-center">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.badge}`}>
              {config.emoji} {config.label}
            </span>
          </div>
        )}

        {/* Forward */}
        {config.next ? (
          <button
            onClick={() => onStatusChange(order.id, config.next!)}
            disabled={isPending}
            title={`Move to ${config.next}`}
            className="p-2 rounded-xl bg-background border border-border hover:bg-muted transition-colors disabled:opacity-50 shrink-0"
          >
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ) : (
          <div className="w-9 shrink-0" />
        )}
      </div>
    </div>
  )
}

export function KitchenClient({ orders: initialOrders }: KitchenClientProps) {
  const [orders, setOrders] = useState(initialOrders ?? [])
  const [isPending, startTransition] = useTransition()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  // Checked items keyed by orderId → itemIndex, lives here so status changes don't reset them
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<number, boolean>>>({})
  const router = useRouter()

  const toggleCheck = (orderId: string, index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [index]: !prev[orderId]?.[index] },
    }))
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
      setLastRefresh(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      await updateOrderStatus(id, status)
      if (status === "COMPLETED" || status === "CANCELLED") {
        // Remove from kitchen view
        setOrders((prev) => prev.filter((o) => o.id !== id))
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: status as KitchenOrder["status"] } : o))
        )
      }
    })
  }

  const pending = orders.filter((o) => o.status === "PENDING")
  // Oldest first in PREPARING so cooks see what needs attention most urgently
  const preparing = orders
    .filter((o) => o.status === "PREPARING")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  const ready = orders.filter((o) => o.status === "READY")

  const columns = [
    { key: "PENDING" as const, orders: pending, config: STATUS_CONFIG.PENDING },
    { key: "PREPARING" as const, orders: preparing, config: STATUS_CONFIG.PREPARING },
    { key: "READY" as const, orders: ready, config: STATUS_CONFIG.READY },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-card shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ChefHat size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-none" style={{ fontFamily: "var(--font-display)" }}>
              Kitchen Display
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              {orders.length} active order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Live badge */}
          <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
          <button
            onClick={() => { router.refresh(); setLastRefresh(new Date()) }}
            className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Updated {elapsed(lastRefresh)} ago
          </span>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-0 divide-x divide-border">
        {columns.map(({ key, orders: colOrders, config }) => (
          <div key={key} className="flex flex-col overflow-hidden">
            {/* Column header */}
            <div className="px-4 py-3 border-b border-border bg-card/80 shrink-0 flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.emoji}</span>
                <span className="font-semibold text-foreground text-sm">{config.label}</span>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${config.badge}`}
              >
                {colOrders.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {colOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-4xl mb-3 opacity-30">{config.emoji}</p>
                  <p className="text-muted-foreground text-xs">No {config.label.toLowerCase()} orders</p>
                </div>
              ) : (
                colOrders.map((order) => (
                  <KitchenCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    isPending={isPending}
                    checked={checkedItems[order.id] ?? {}}
                    onToggleCheck={(index) => toggleCheck(order.id, index)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}