import { getDashboardStats } from "@/lib/actions/orders"
import { getStoreSettings } from "@/lib/actions/settings"
import { getInventoryItems } from "@/lib/actions/inventory"
import { Header } from "@/components/layout/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { TopItemsChart } from "@/components/dashboard/top-items-chart"
import { PaymentMethodChart } from "@/components/dashboard/payment-method-chart"
import { CategoryRevenueChart } from "@/components/dashboard/category-revenue-chart"
import { StockOverview } from "@/components/dashboard/stock-overview"
import { TimeFilter } from "@/components/dashboard/time-filter"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import type { DashboardRange } from "@/lib/actions/orders"

export const metadata = { title: "Dashboard" }

const VALID_RANGES: DashboardRange[] = ["today", "7d", "30d", "month", "year", "all", "custom"]
function isValidRange(v: unknown): v is DashboardRange {
  return VALID_RANGES.includes(v as DashboardRange)
}

/** Human-readable label for the active filter period */
function buildPeriodLabel(
  range: DashboardRange,
  from?: string,
  to?: string
): string {
  if (range === "today")  return "Today"
  if (range === "7d")     return "Last 7 days"
  if (range === "30d")    return "Last 30 days"
  if (range === "month")  return "This month"
  if (range === "year")   return "This year"
  if (range === "all")    return "All time"
  if (range === "custom") {
    const fmtYM = (ym: string) => {
      const [y, m] = ym.split("-")
      if (!y || !m) return ym
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-PH", {
        month: "short",
        year: "numeric",
      })
    }
    if (from && to)  return `${fmtYM(from)} – ${fmtYM(to)}`
    if (from)        return `From ${fmtYM(from)}`
    return "Custom range"
  }
  return ""
}

interface DashboardPageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { range: rawRange, from, to } = await searchParams
  const range: DashboardRange = isValidRange(rawRange) ? rawRange : "today"

  const periodLabel = buildPeriodLabel(range, from, to)

  const [stats, settings, allInventory] = await Promise.all([
    getDashboardStats({ range, from, to }),
    getStoreSettings(),
    getInventoryItems(),
  ])

  const lowStockCount = allInventory.filter(
    (i) => parseFloat(i.currentStock) <= parseFloat(i.lowStockThreshold)
  ).length

  return (
    <>
      <Header title="Dashboard" subtitle={periodLabel} />

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <Link
            href="/inventory"
            className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <AlertTriangle
              className="text-amber-600 dark:text-amber-400 shrink-0"
              size={18}
            />
            <p className="text-amber-800 dark:text-amber-400 text-sm font-medium">
              {lowStockCount} item{lowStockCount !== 1 ? "s are" : " is"} running
              low on stock — tap to manage inventory
            </p>
          </Link>
        )}

        {/* Time filter */}
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs text-muted-foreground font-medium pt-2">
            Showing:{" "}
            <span className="text-foreground font-semibold">{periodLabel}</span>
          </p>
          <Suspense>
            <TimeFilter current={range} currentFrom={from} currentTo={to} />
          </Suspense>
        </div>

        {/* KPI cards */}
        <StatsCards stats={stats} settings={settings as never} />

        {/* Revenue trend (full width) */}
        <RevenueChart
          data={stats.revenueByPeriod}
          isHourly={stats.isHourly}
          isMonthly={stats.isMonthly}
          periodLabel={periodLabel}
          settings={settings as never}
        />

        {/* Category revenue + Payment methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CategoryRevenueChart
            data={stats.categoryRevenue}
            periodLabel={periodLabel}
            settings={settings as never}
          />
          <PaymentMethodChart
            data={stats.paymentBreakdown}
            periodLabel={periodLabel}
            settings={settings as never}
          />
        </div>

        {/* Top items + Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TopItemsChart
            data={stats.topItems}
            periodLabel={periodLabel}
            settings={settings as never}
          />
          <StockOverview items={allInventory} />
        </div>

      </div>
    </>
  )
}