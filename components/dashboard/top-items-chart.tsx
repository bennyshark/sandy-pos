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
  settings: StoreSettings
}

const SANDY_COLORS = [
  "#c2903a", "#d4a958", "#dbb96b", "#e2c484",
  "#835b22", "#a4752d", "#62431a", "#432e11",
]

export function TopItemsChart({ data, settings }: TopItemsChartProps) {
  const top = data.slice(0, 8)

  const chartData = {
    labels: top.map((i) =>
      i.name.length > 12 ? i.name.slice(0, 12) + "…" : i.name
    ),
    datasets: [
      {
        data: top.map((i) => i.count),
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
          label: (ctx: { raw: unknown }) => ` ${ctx.raw} sold`,
          afterLabel: (ctx: { dataIndex: number }) =>
            ` Revenue: ${formatCurrency(top[ctx.dataIndex]?.revenue ?? 0, settings.currencySymbol)}`,
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
          stepSize: 1,
        },
        border: { display: false },
      },
    },
  }

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-4 text-sm">
        Top Selling Items — Last 30 Days
      </h3>
      <div className="h-52">
        {top.length > 0 ? (
          <Bar data={chartData} options={options as never} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No sales data yet
          </div>
        )}
      </div>
    </div>
  )
}
