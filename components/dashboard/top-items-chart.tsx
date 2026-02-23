"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import { formatCurrency } from "@/lib/utils"
import type { StoreSettings } from "@/types"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface TopItemsChartProps {
  data: { name: string; count: number; revenue: number }[]
  periodLabel?: string
  settings: StoreSettings
}

const SANDY_COLORS = [
  "#c2903a", "#d4a958", "#dbb96b", "#e2c484",
  "#835b22", "#a4752d", "#62431a", "#432e11",
]

export function TopItemsChart({ data, periodLabel, settings }: TopItemsChartProps) {
  // Already sorted by revenue from the server
  const top = data.slice(0, 8)

  const chartData = {
    labels: top.map((i) =>
      i.name.length > 14 ? i.name.slice(0, 14) + "…" : i.name
    ),
    datasets: [
      {
        data: top.map((i) => i.revenue),
        backgroundColor: SANDY_COLORS,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown; dataIndex: number }) =>
            ` Revenue: ${formatCurrency(ctx.raw as number, settings.currencySymbol)}`,
          afterLabel: (ctx: { dataIndex: number }) =>
            ` Units sold: ${top[ctx.dataIndex]?.count ?? 0}`,
        },
        backgroundColor: "hsl(30 16% 12%)",
        titleColor: "hsl(40 35% 90%)",
        bodyColor: "#d4a958",
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "hsl(34 14% 48%)", font: { size: 10 } },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(212,169,88,0.08)" },
        ticks: {
          color: "hsl(34 14% 48%)",
          font: { size: 11 },
          callback: (v: unknown) =>
            `${settings.currencySymbol}${Number(v).toLocaleString()}`,
        },
        border: { display: false },
      },
    },
  }

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground text-sm">Top Items by Revenue</h3>
        {periodLabel && (
          <span className="inline-block mt-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {periodLabel}
          </span>
        )}
      </div>
      <div className="h-52">
        {top.length > 0 ? (
          <Bar data={chartData} options={options as never} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No sales data for this period
          </div>
        )}
      </div>
    </div>
  )
}