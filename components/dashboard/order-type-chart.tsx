"use client"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend)

const TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Dine In",
  TAKEOUT: "Takeout",
  DELIVERY: "Delivery",
}

interface OrderTypeChartProps {
  data: { type: string; count: number }[]
}

export function OrderTypeChart({ data }: OrderTypeChartProps) {
  const chartData = {
    labels: data.map((d) => TYPE_LABELS[d.type] ?? d.type),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: ["#c2903a", "#d4a958", "#835b22"],
        borderColor: ["#a4752d", "#c2903a", "#62431a"],
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
          label: (ctx: { raw: unknown; label: string }) =>
            ` ${ctx.label}: ${ctx.raw}`,
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

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <h3 className="font-semibold text-foreground mb-4 text-sm">
        Order Types — Today
      </h3>
      <div className="h-52">
        {data.length > 0 ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No orders today
          </div>
        )}
      </div>
    </div>
  )
}
