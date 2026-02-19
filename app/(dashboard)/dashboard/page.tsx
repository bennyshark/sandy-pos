import { getDashboardStats } from "@/lib/actions/orders"
import { getStoreSettings } from "@/lib/actions/settings"
import { getLowStockItems } from "@/lib/actions/inventory"
import { Header } from "@/components/layout/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { TopItemsChart } from "@/components/dashboard/top-items-chart"
import { OrderTypeChart } from "@/components/dashboard/order-type-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const [stats, settings, lowStock] = await Promise.all([
    getDashboardStats(),
    getStoreSettings(),
    getLowStockItems(),
  ])

  return (
    <>
      <Header title="Dashboard" subtitle="Today's sales overview" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Low stock alert banner */}
        {lowStock.length > 0 && (
          <Link
            href="/inventory"
            className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <AlertTriangle
              className="text-amber-600 dark:text-amber-400 shrink-0"
              size={18}
            />
            <p className="text-amber-800 dark:text-amber-400 text-sm font-medium">
              {lowStock.length} item{lowStock.length !== 1 ? "s are" : " is"}{" "}
              running low on stock — tap to manage inventory
            </p>
          </Link>
        )}

        {/* KPI cards */}
        <StatsCards stats={stats as never} settings={settings as never} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <RevenueChart
              data={stats.revenueByDay}
              settings={settings as never}
            />
          </div>
          <OrderTypeChart data={stats.orderTypeBreakdown} />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TopItemsChart
            data={stats.topItems}
            settings={settings as never}
          />
          <RecentOrders
            orders={stats.recentOrders as never}
            settings={settings as never}
          />
        </div>
      </div>
    </>
  )
}
