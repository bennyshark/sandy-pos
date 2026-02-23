import Link from "next/link"
import { AlertTriangle, Package } from "lucide-react"

interface StockItem {
  id: string
  name: string
  unit: string
  currentStock: string
  lowStockThreshold: string
}

interface StockOverviewProps {
  items: StockItem[]
}

function getStockHealth(current: number, threshold: number) {
  if (current <= 0)           return { label: "Out",      color: "bg-red-500",    text: "text-red-600 dark:text-red-400",    bar: "bg-red-500"    }
  if (current <= threshold)   return { label: "Low",      color: "bg-amber-500",  text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500"  }
  if (current <= threshold * 2) return { label: "OK",     color: "bg-yellow-400", text: "text-yellow-600 dark:text-yellow-400", bar: "bg-yellow-400" }
  return                             { label: "Good",     color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" }
}

export function StockOverview({ items }: StockOverviewProps) {
  // Sort: out of stock → low → ok → good
  const sorted = [...items].sort((a, b) => {
    const aStock = parseFloat(a.currentStock)
    const bStock = parseFloat(b.currentStock)
    const aThresh = parseFloat(a.lowStockThreshold)
    const bThresh = parseFloat(b.lowStockThreshold)
    const aRatio = aStock / (aThresh || 1)
    const bRatio = bStock / (bThresh || 1)
    return aRatio - bRatio
  })

  const outCount  = items.filter((i) => parseFloat(i.currentStock) <= 0).length
  const lowCount  = items.filter((i) => {
    const s = parseFloat(i.currentStock)
    return s > 0 && s <= parseFloat(i.lowStockThreshold)
  }).length
  const goodCount = items.length - outCount - lowCount

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Stock Overview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{items.length} inventory items</p>
        </div>
        <Link
          href="/inventory"
          className="text-primary text-xs hover:underline font-medium"
        >
          Manage →
        </Link>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 mb-4">
        {outCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 px-2 py-1 rounded-full">
            <AlertTriangle size={11} />
            {outCount} out of stock
          </span>
        )}
        {lowCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 px-2 py-1 rounded-full">
            <AlertTriangle size={11} />
            {lowCount} low
          </span>
        )}
        {goodCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 px-2 py-1 rounded-full">
            <Package size={11} />
            {goodCount} healthy
          </span>
        )}
      </div>

      {/* Item list — show up to 8, prioritising critical ones */}
      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            No inventory items yet
          </p>
        ) : (
          sorted.slice(0, 10).map((item) => {
            const current   = parseFloat(item.currentStock)
            const threshold = parseFloat(item.lowStockThreshold)
            const health    = getStockHealth(current, threshold)
            // Cap bar at 100% but show real numbers
            const pct       = Math.min(100, threshold > 0 ? (current / (threshold * 3)) * 100 : 100)

            return (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground truncate max-w-[55%]">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold ${health.text}`}>
                      {health.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {current % 1 === 0 ? current : current.toFixed(1)}{" "}
                      <span className="text-[9px]">{item.unit}</span>
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${health.bar}`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {sorted.length > 10 && (
        <Link
          href="/inventory"
          className="block text-center text-xs text-primary mt-3 hover:underline"
        >
          View all {sorted.length} items →
        </Link>
      )}
    </div>
  )
}