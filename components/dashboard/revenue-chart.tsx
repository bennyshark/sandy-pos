"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { formatCurrency } from "@/lib/utils"
import type { StoreSettings } from "@/types"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
)

interface RevenueChartProps {
  data: { period: string; revenue: number; orderCount: number }[]
  isHourly: boolean
  isMonthly?: boolean
  periodLabel?: string
  settings: StoreSettings
}

function formatPeriodLabel(period: string, isHourly: boolean, isMonthly?: boolean): string {
  const d = new Date(period)
  if (isHourly) {
    return d.toLocaleTimeString("en-PH", { hour: "numeric", hour12: true })
  }
  if (isMonthly) {
    return d.toLocaleDateString("en-PH", { month: "short", year: "numeric" })
  }
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
}

const crosshairPlugin = {
  id: "crosshair",
  afterDraw(chart: ChartJS) {
    const { ctx, chartArea, scales } = chart
    const active = chart.tooltip?.getActiveElements?.()
    if (!active || active.length === 0) return

    const x = (scales.x as { getPixelForValue: (v: number) => number }).getPixelForValue(
      active[0].index
    )

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x, chartArea.top)
    ctx.lineTo(x, chartArea.bottom)
    ctx.lineWidth = 1.5
    ctx.strokeStyle = "rgba(194,144,58,0.5)"
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.restore()
  },
}

export function RevenueChart({ data, isHourly, isMonthly, periodLabel, settings }: RevenueChartProps) {
  const labels = data.map((d) => formatPeriodLabel(d.period, isHourly, isMonthly))

  const chartData = {
    labels,
    datasets: [
      {
        label: "Revenue",
        data: data.map((d) => d.revenue),
        borderColor: "#c2903a",
        backgroundColor: (ctx: {
          chart: {
            ctx: CanvasRenderingContext2D
            chartArea?: { top: number; bottom: number }
          }
        }) => {
          const gradient = ctx.chart.ctx.createLinearGradient(
            0,
            ctx.chart.chartArea?.top ?? 0,
            0,
            ctx.chart.chartArea?.bottom ?? 300
          )
          gradient.addColorStop(0, "rgba(194,144,58,0.25)")
          gradient.addColorStop(1, "rgba(194,144,58,0.02)")
          return gradient
        },
        borderWidth: 2.5,
        pointBackgroundColor: "#c2903a",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown; dataIndex: number }) => {
            const orders = data[ctx.dataIndex]?.orderCount ?? 0
            return [
              ` Revenue: ${formatCurrency(ctx.raw as number, settings.currencySymbol)}`,
              ` Orders: ${orders}`,
            ]
          },
        },
        backgroundColor: "hsl(30 16% 12%)",
        titleColor: "hsl(40 35% 90%)",
        bodyColor: "#d4a958",
        borderColor: "hsl(30 14% 22%)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "hsl(34 14% 48%)", font: { size: 11 } },
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
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Revenue Trend</h3>
          {periodLabel && (
            <span className="inline-block mt-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {periodLabel}
            </span>
          )}
        </div>
      </div>
      <div className="h-52">
        {data.length > 0 ? (
          <Line
            data={chartData}
            options={options as never}
            plugins={[crosshairPlugin as never]}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No revenue data for this period
          </div>
        )}
      </div>
    </div>
  )
}