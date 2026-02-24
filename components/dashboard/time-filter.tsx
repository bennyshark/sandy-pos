"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { CalendarRange, ChevronDown, X } from "lucide-react"
import type { DashboardRange } from "@/lib/actions/orders"

const QUICK_RANGES: { value: DashboardRange; label: string }[] = [
  { value: "today",  label: "Today"      },
  { value: "7d",     label: "7 Days"     },
  { value: "30d",    label: "30 Days"    },
  { value: "month",  label: "This Month" },
  { value: "year",   label: "This Year"  },
  { value: "all",    label: "All Time"   },
]

interface TimeFilterProps {
  current: DashboardRange
  currentFrom?: string
  currentTo?: string
}

export function TimeFilter({ current, currentFrom, currentTo }: TimeFilterProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const [, startTransition] = useTransition()

  const [showCustom, setShowCustom] = useState(current === "custom")
  const [from, setFrom] = useState(currentFrom ?? "")
  const [to,   setTo  ] = useState(currentTo   ?? "")

  function push(range: DashboardRange, extraFrom?: string, extraTo?: string) {
    const next = new URLSearchParams(params.toString())
    next.set("range", range)
    if (extraFrom) next.set("from", extraFrom); else next.delete("from")
    if (extraTo)   next.set("to",   extraTo);   else next.delete("to")
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  function handleQuick(range: DashboardRange) {
    setShowCustom(false)
    push(range)
  }

  function handleCustomApply() {
    if (!from) return
    push("custom", from, to || undefined)
  }

  function handleCustomClear() {
    setFrom("")
    setTo("")
    setShowCustom(false)
    push("year")
  }

  const isCustomActive = current === "custom"

  return (
    <div className="flex flex-col gap-2 items-end">
      {/* Quick pills row */}
      <div className="flex items-center gap-1 flex-wrap justify-end">
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {QUICK_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => handleQuick(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                current === r.value && !showCustom
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Custom range toggle button */}
        <button
          onClick={() => setShowCustom((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
            isCustomActive || showCustom
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
          }`}
        >
          <CalendarRange size={13} />
          {isCustomActive && currentFrom
            ? `${fmtMonth(currentFrom)}${currentTo ? ` \u2013 ${fmtMonth(currentTo)}` : ""}`
            : "Custom"}
          <ChevronDown
            size={12}
            className={`transition-transform ${showCustom ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Custom date range panel */}
      {showCustom && (
        <div className="flex items-end gap-2 bg-card border border-border rounded-xl p-3 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              From
            </label>
            <input
              type="month"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              To
            </label>
            <input
              type="month"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleCustomApply}
            disabled={!from}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>

          <button
            onClick={handleCustomClear}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Clear custom range"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

/** Formats "YYYY-MM" \u2192 "Aug 2020" */
function fmtMonth(ym: string): string {
  const [year, month] = ym.split("-")
  if (!year || !month) return ym
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString("en-PH", { month: "short", year: "numeric" })
}