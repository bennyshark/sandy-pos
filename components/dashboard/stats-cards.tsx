import { formatCurrency } from "@/lib/utils"
import { TrendingUp, ShoppingBag, DollarSign, Tag } from "lucide-react"
import type { StoreSettings } from "@/types"

interface StatsCardsProps {
  stats: {
    revenue: number
    grossSales: number
    orderCount: number
    avgOrderValue: number
  }
  settings: StoreSettings
}

export function StatsCards({ stats, settings }: StatsCardsProps) {
  const sym = settings.currencySymbol

  const cards = [
    {
      title: "Net Revenue",
      value: formatCurrency(stats.revenue, sym),
      icon: DollarSign,
      bg: "bg-primary/10 dark:bg-primary/20",
      iconColor: "text-primary",
      border: "border-primary/20",
    },
    {
      title: "Orders",
      value: stats.orderCount.toString(),
      icon: ShoppingBag,
      bg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-900",
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(stats.avgOrderValue, sym),
      icon: TrendingUp,
      bg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-900",
    },
    {
      title: "Gross Sales",
      value: formatCurrency(stats.grossSales, sym),
      icon: Tag,
      bg: "bg-violet-100 dark:bg-violet-900/30",
      iconColor: "text-violet-600 dark:text-violet-400",
      border: "border-violet-200 dark:border-violet-900",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`bg-card rounded-2xl p-5 border ${card.border} shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide truncate">
                {card.title}
              </p>
              <p
                className="text-2xl font-bold text-foreground mt-1.5 truncate"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {card.value}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${card.bg} shrink-0 ml-2`}>
              <card.icon size={19} className={card.iconColor} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}