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

interface CategoryRevenueChartProps {
  data: { name: string; revenue: number; count: number }[]
  settings: StoreSettings
}

const CAT_COLORS = [
  "#c2903a", "#58a4c2", "#7aab5e", "#b07dc9",
  "#e05c8a", "#d47a34", "#4caf82", "#9b7fd4",
]

export function CategoryRevenueChart({ data, settings }: CategoryRevenueChartProps) {
  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.revenue),
        backgroundColor: data.map((_, i) => CAT_COLORS[i % CAT_COLORS.length]),
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 20,
      },
    ],
  }

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown; dataIndex: number }) => {
            const item = data[ctx.dataIndex]
            return [
              ` ${formatCurrency(ctx.raw as number, settings.currencySymbol)}`,
              ` ${item?.count ?? 0} items sold`,
            ]
          },
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
        grid: { color: "rgba(212,169,88,0.08)" },
        ticks: {
          color: "hsl(34 14% 48%)",
          font: { size: 10 },
          callback: (v: unknown) =>
            `${settings.currencySymbol}${Number(v).toLocaleString()}`,
        },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: { color: "hsl(34 14% 48%)", font: { size: 11 } },
        border: { display: false },
      },
    },
  }

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-1 text-sm">
        Revenue by Category
      </h3>
      <p className="text-xs text-muted-foreground mb-3">Best-performing product lines</p>
      <div className="h-52">
        {data.length > 0 ? (
          <Bar data={chartData} options={options as never} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No category data for this period
          </div>
        )}
      </div>
    </div>
  )
}