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

const VALID_RANGES: DashboardRange[] = ["today", "7d", "30d", "month"]

function isValidRange(v: unknown): v is DashboardRange {
  return VALID_RANGES.includes(v as DashboardRange)
}

const RANGE_LABELS: Record<DashboardRange, string> = {
  today: "Today",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  month: "This Month",
}

interface DashboardPageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { range: rawRange } = await searchParams
  const range: DashboardRange = isValidRange(rawRange) ? rawRange : "today"

  const [stats, settings, allInventory] = await Promise.all([
    getDashboardStats(range),
    getStoreSettings(),
    getInventoryItems(),
  ])

  const lowStockCount = allInventory.filter(
    (i) => parseFloat(i.currentStock) <= parseFloat(i.lowStockThreshold)
  ).length

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={RANGE_LABELS[range]}
      />

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
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium">
            Showing data for:{" "}
            <span className="text-foreground">{RANGE_LABELS[range]}</span>
          </p>
          <Suspense>
            <TimeFilter current={range} />
          </Suspense>
        </div>

        {/* KPI cards */}
        <StatsCards stats={stats} settings={settings as never} />

        {/* Revenue trend (full width) */}
        <RevenueChart
          data={stats.revenueByPeriod}
          isHourly={stats.isHourly}
          settings={settings as never}
        />

        {/* Category revenue + Payment methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CategoryRevenueChart
            data={stats.categoryRevenue}
            settings={settings as never}
          />
          <PaymentMethodChart
            data={stats.paymentBreakdown}
            settings={settings as never}
          />
        </div>

        {/* Top items + Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TopItemsChart
            data={stats.topItems}
            settings={settings as never}
          />
          <StockOverview items={allInventory} />
        </div>

      </div>
    </>
  )
}