"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { DashboardRange } from "@/lib/actions/orders"

const RANGES: { value: DashboardRange; label: string }[] = [
  { value: "today",  label: "Today"      },
  { value: "7d",     label: "7 Days"     },
  { value: "30d",    label: "30 Days"    },
  { value: "month",  label: "This Month" },
]

interface TimeFilterProps {
  current: DashboardRange
}

export function TimeFilter({ current }: TimeFilterProps) {
  const router    = useRouter()
  const pathname  = usePathname()
  const params    = useSearchParams()

  function handleChange(range: DashboardRange) {
    const next = new URLSearchParams(params.toString())
    next.set("range", range)
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => handleChange(r.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            current === r.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}