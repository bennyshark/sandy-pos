"use client"

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Doughnut } from "react-chartjs-2"
import { formatCurrency } from "@/lib/utils"
import type { StoreSettings } from "@/types"

ChartJS.register(ArcElement, Tooltip, Legend)

const METHOD_LABELS: Record<string, string> = {
  CASH:   "Cash",
  CARD:   "Card",
  GCASH:  "GCash",
  MAYA:   "Maya",
  OTHER:  "Other",
}

const METHOD_COLORS: Record<string, string> = {
  CASH:  "#c2903a",
  CARD:  "#58a4c2",
  GCASH: "#4caf82",
  MAYA:  "#9b7fd4",
  OTHER: "#835b22",
}

const METHOD_BORDER: Record<string, string> = {
  CASH:  "#a4752d",
  CARD:  "#3d8aaa",
  GCASH: "#389464",
  MAYA:  "#7a5fba",
  OTHER: "#62431a",
}

interface PaymentMethodChartProps {
  data: { method: string; count: number; revenue: number }[]
  settings: StoreSettings
}

export function PaymentMethodChart({ data, settings }: PaymentMethodChartProps) {
  const sym = settings.currencySymbol

  const chartData = {
    labels: data.map((d) => METHOD_LABELS[d.method] ?? d.method),
    datasets: [
      {
        data: data.map((d) => d.revenue),
        backgroundColor: data.map((d) => METHOD_COLORS[d.method] ?? "#c2903a"),
        borderColor: data.map((d) => METHOD_BORDER[d.method] ?? "#a4752d"),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "hsl(34 14% 48%)",
          font: { size: 11 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown; label: string; dataIndex: number }) => {
            const item = data[ctx.dataIndex]
            return [
              ` ${ctx.label}: ${formatCurrency(ctx.raw as number, sym)}`,
              ` ${item?.count ?? 0} transactions`,
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
  }

  // Total for center label
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-1 text-sm">
        Payment Methods
      </h3>
      <p className="text-xs text-muted-foreground mb-3">Revenue split by tender type</p>
      <div className="h-52">
        {data.length > 0 ? (
          <div className="relative h-full">
            <Doughnut data={chartData} options={options} />
            {/* Center total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</span>
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(totalRevenue, sym)}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No transactions for this period
          </div>
        )}
      </div>
    </div>
  )
}