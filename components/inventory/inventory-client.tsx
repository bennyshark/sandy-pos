"use client"

import { useState, useTransition, useCallback, useMemo } from "react"
import {
  createInventoryItem,
  restockItem,
  deleteInventoryItem,
  updateInventoryItem,
} from "@/lib/actions/inventory"
import {
  Plus,
  Trash2,
  AlertTriangle,
  X,
  Search,
  SlidersHorizontal,
  Minus,
  Pencil,
  Check,
} from "lucide-react"
import type { InventoryItem } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryClientProps {
  initialItems: InventoryItem[]
}

type FilterType = "all" | "low" | "out"
type AdjustMode = "adjust" | "set"

const UNITS = [
  "pcs", "bag", "bottle", "box", "can", "pack",
  "set", "roll", "pair", "g", "kg", "ml", "l", "oz", "lb", "cups",
] as const

type UnitType = (typeof UNITS)[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStockStatus(stock: number, minStock: number) {
  if (stock <= 0)
    return {
      label: "Out of Stock",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      bar: "bg-red-500",
      barTrack: "bg-red-100 dark:bg-red-900/30",
      row: "bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20",
    }
  if (stock <= minStock)
    return {
      label: "Low Stock",
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      bar: "bg-yellow-500",
      barTrack: "bg-yellow-100 dark:bg-yellow-900/30",
      row: "bg-yellow-50/40 dark:bg-yellow-900/10 hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
    }
  return {
    label: "In Stock",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    bar: "bg-emerald-500",
    barTrack: "bg-emerald-100 dark:bg-emerald-900/30",
    row: "hover:bg-muted/30",
  }
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Stock Level Bar ──────────────────────────────────────────────────────────

function StockLevelBar({ stock, minStock, unit }: { stock: number; minStock: number; unit: string }) {
  const max = Math.max(stock, minStock * 2, 1)
  const pct = Math.min(100, (stock / max) * 100)
  const status = getStockStatus(stock, minStock)

  return (
    <div className="flex flex-col gap-1 w-full max-w-[140px]">
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-bold tabular-nums ${status.color}`}>
          {stock.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          of {minStock} {unit}
        </span>
      </div>
      <div className={`h-1.5 w-full rounded-full overflow-hidden ${status.barTrack}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${status.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Adjust Modal ─────────────────────────────────────────────────────────────

function AdjustModal({
  item,
  onClose,
  onConfirm,
  isPending,
}: {
  item: InventoryItem
  onClose: () => void
  onConfirm: (delta: number, newMinStock: number) => void
  isPending: boolean
}) {
  const currentStock = parseFloat(item.currentStock)
  const minStock = parseFloat(item.lowStockThreshold)

  const [mode, setMode] = useState<AdjustMode>("adjust")
  const [inputVal, setInputVal] = useState("0")
  const [minStockVal, setMinStockVal] = useState(String(Math.round(minStock)))

  const parsedMin = parseInt(minStockVal, 10) || 0
  const parsed = parseInt(inputVal, 10) || 0
  const delta = mode === "adjust" ? parsed : parsed - currentStock
  const newStock = Math.max(0, mode === "adjust" ? currentStock + parsed : parsed)
  const stockNoChange = mode === "adjust" ? parsed === 0 : parsed === currentStock
  const minNoChange = parsedMin === Math.round(minStock)
  const noChange = stockNoChange && minNoChange
  const newStatus = getStockStatus(newStock, parsedMin)

  const step = (n: number) =>
    setInputVal(String((parseInt(inputVal, 10) || 0) + n))

  const stepMin = (n: number) =>
    setMinStockVal(String(Math.max(0, (parseInt(minStockVal, 10) || 0) + n)))

  const handleInput = (val: string) => {
    if (val === "" || val === "-") {
      setInputVal(val)
    } else {
      const n = parseInt(val, 10)
      if (!isNaN(n)) setInputVal(String(n))
    }
  }

  const switchMode = (m: AdjustMode) => {
    setMode(m)
    setInputVal(m === "adjust" ? "0" : String(Math.round(currentStock)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Adjust Stock</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Product info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
              <p className="text-xs font-mono text-muted-foreground">{item.unit}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-foreground tabular-nums">
                {currentStock.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">current</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl border border-border bg-muted p-1 gap-1">
            {(["adjust", "set"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === m
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "adjust" ? "Adjust (±)" : "Set Stock"}
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {mode === "adjust" ? "Adjustment Amount" : "New Stock Value"}
            </label>
            <div className="flex items-center gap-2">
              {mode === "adjust" && (
                <button
                  onClick={() => step(-10)}
                  className="w-9 h-9 rounded-lg border border-border bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
                >
                  −10
                </button>
              )}
              <button
                onClick={() => step(-1)}
                className="w-9 h-9 rounded-lg border border-border bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4 text-muted-foreground" />
              </button>
              <input
                type="number"
                value={inputVal}
                onChange={(e) => handleInput(e.target.value)}
                min={mode === "set" ? "0" : undefined}
                className="flex-1 h-11 rounded-xl border-2 border-primary/30 bg-background text-center text-xl font-bold focus:outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => step(1)}
                className="w-9 h-9 rounded-lg border border-border bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
              {mode === "adjust" && (
                <button
                  onClick={() => step(10)}
                  className="w-9 h-9 rounded-lg border border-border bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
                >
                  +10
                </button>
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {stockNoChange
                ? "No change"
                : mode === "adjust"
                ? parsed > 0
                  ? `Adding ${parsed} ${item.unit}(s)`
                  : `Removing ${Math.abs(parsed)} ${item.unit}(s)`
                : `Setting stock to ${parsed} ${item.unit}(s)`}
            </p>
          </div>

          {/* Preview — shown only when there is a stock change */}
          {!stockNoChange && (
            <div
              className={`flex items-center justify-between p-3 rounded-xl border ${
                newStock === 0
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : newStock <= parsedMin
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                  : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">{currentStock}</p>
                </div>
                <span className="text-muted-foreground font-bold text-lg">→</span>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">New Stock</p>
                  <p className={`text-xl font-bold tabular-nums ${newStatus.color}`}>{newStock}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${newStatus.bg}`}>
                {newStatus.label}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Min Stock Threshold</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Min stock input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepMin(-10)}
                className="w-9 h-9 rounded-lg border border-border bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
              >
                −10
              </button>
              <button
                onClick={() => stepMin(-1)}
                className="w-9 h-9 rounded-lg border border-border bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4 text-muted-foreground" />
              </button>
              <input
                type="number"
                value={minStockVal}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (!isNaN(n) && n >= 0) setMinStockVal(String(n))
                  else if (e.target.value === "") setMinStockVal("")
                }}
                min="0"
                className="flex-1 h-11 rounded-xl border-2 border-yellow-300/60 bg-background text-center text-xl font-bold focus:outline-none focus:border-yellow-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => stepMin(1)}
                className="w-9 h-9 rounded-lg border border-border bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => stepMin(10)}
                className="w-9 h-9 rounded-lg border border-border bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
              >
                +10
              </button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {minNoChange
                ? `Currently ${minStock} ${item.unit}(s) — no change`
                : parsedMin > minStock
                ? `Raising threshold from ${minStock} → ${parsedMin} ${item.unit}(s)`
                : `Lowering threshold from ${minStock} → ${parsedMin} ${item.unit}(s)`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => !noChange && onConfirm(delta, parsedMin)}
            disabled={noChange || isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              noChange
                ? "bg-transparent text-muted-foreground cursor-default"
                : !stockNoChange && delta > 0
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {isPending && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {noChange
              ? "No Change"
              : stockNoChange
              ? "Update Min Stock"
              : mode === "set"
              ? "Set Stock"
              : delta > 0
              ? "Add Stock"
              : "Remove Stock"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────

function AddItemModal({
  show,
  onClose,
  onAdd,
  isPending,
}: {
  show: boolean
  onClose: () => void
  onAdd: (data: { name: string; unit: UnitType; currentStock: string; lowStockThreshold: string; costPerUnit: string }) => void
  isPending: boolean
}) {
  const [name, setName] = useState("")
  const [unit, setUnit] = useState<UnitType>("pcs")
  const [stock, setStock] = useState("")
  const [threshold, setThreshold] = useState("10")
  const [cost, setCost] = useState("0")

  const inputClass =
    "w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"

  const handleSubmit = () => {
    if (!name) return
    onAdd({ name, unit, currentStock: stock || "0", lowStockThreshold: threshold, costPerUnit: cost })
    setName(""); setStock(""); setThreshold("10"); setCost("0")
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">New Inventory Item</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Coffee Beans" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as UnitType)} className={inputClass}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Initial Stock</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} placeholder="0" min="0" step="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Min Stock</label>
              <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className={inputClass} placeholder="10" min="0" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Cost / Unit (₱)</label>
              <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className={inputClass} placeholder="0" min="0" step="0.01" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!name || isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            {isPending ? "Adding…" : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InventoryClient({ initialItems }: InventoryClientProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [isPending, startTransition] = useTransition()

  const [filter, setFilter] = useState<FilterType>("all")
  const [search, setSearch] = useState("")
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMinStockId, setEditingMinStockId] = useState<string | null>(null)
  const [editingMinStockVal, setEditingMinStockVal] = useState("")

  const handleMinStockEdit = useCallback((item: InventoryItem) => {
    setEditingMinStockId(item.id)
    setEditingMinStockVal(item.lowStockThreshold)
  }, [])

  const handleMinStockSave = useCallback(
    (id: string) => {
      const val = parseInt(editingMinStockVal, 10)
      if (isNaN(val) || val < 0) { setEditingMinStockId(null); return }
      startTransition(async () => {
        await updateInventoryItem(id, { lowStockThreshold: String(val) })
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, lowStockThreshold: String(val) } : i))
        )
        setEditingMinStockId(null)
      })
    },
    [editingMinStockVal]
  )

  const isLow = (item: InventoryItem) => {
    const s = parseFloat(item.currentStock)
    const t = parseFloat(item.lowStockThreshold)
    return s > 0 && s <= t
  }
  const isOut = (item: InventoryItem) => parseFloat(item.currentStock) <= 0

  const stats = useMemo(
    () => ({ total: items.length, low: items.filter(isLow).length, out: items.filter(isOut).length }),
    [items]
  )

  const filteredItems = useMemo(() => {
    let list = items
    if (filter === "low") list = list.filter(isLow)
    if (filter === "out") list = list.filter(isOut)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) => i.name.toLowerCase().includes(q))
    }
    return list
  }, [items, filter, search])

  const handleAdjust = useCallback(
    (delta: number, newMinStock: number) => {
      if (!adjustingItem) return
      const id = adjustingItem.id
      const oldMin = parseFloat(adjustingItem.lowStockThreshold)
      startTransition(async () => {
        if (delta !== 0) await restockItem(id, delta)
        if (newMinStock !== Math.round(oldMin)) {
          await updateInventoryItem(id, { lowStockThreshold: String(newMinStock) })
        }
        const now = new Date()
        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  currentStock: delta !== 0
                    ? Math.max(0, parseFloat(i.currentStock) + delta).toFixed(2)
                    : i.currentStock,
                  lowStockThreshold: String(newMinStock),
                  updatedAt: now,
                }
              : i
          )
        )
        setAdjustingItem(null)
      })
    },
    [adjustingItem]
  )

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Delete this inventory item?")) return
    startTransition(async () => {
      await deleteInventoryItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    })
  }, [])

  const handleAdd = useCallback(
    (data: { name: string; unit: UnitType; currentStock: string; lowStockThreshold: string; costPerUnit: string }) => {
      startTransition(async () => {
        const r = await createInventoryItem(data as Parameters<typeof createInventoryItem>[0])
        if (r.success && r.data) {
          setItems((prev) => [...prev, r.data as InventoryItem])
          setShowAddForm(false)
        }
      })
    },
    []
  )

  return (
    <div className="space-y-5">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all" as FilterType, label: "All Items",    count: stats.total, base: "bg-card border border-border text-foreground",                                                                                                  ring: "ring-2 ring-primary/30" },
            { key: "low" as FilterType, label: "Low Stock",    count: stats.low,   base: "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400",                      ring: "ring-2 ring-yellow-400/40" },
            { key: "out" as FilterType, label: "Out of Stock", count: stats.out,   base: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400",                                        ring: "ring-2 ring-red-400/40" },
          ] as const
        ).map(({ key, label, count, base, ring }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${base} ${
              filter === key ? ring + " shadow-sm" : "opacity-70 hover:opacity-100"
            }`}
          >
            {label}
            <span className="font-bold tabular-nums">{count}</span>
          </button>
        ))}
        <button
          onClick={() => setShowAddForm(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-md"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Item", "Unit", "Stock Level", "Min Stock", "Status", "Updated", ""].map((h, i) => (
                <th
                  key={i}
                  className={`px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-14 text-muted-foreground text-sm">
                  <p className="text-3xl mb-2">📦</p>
                  {search || filter !== "all"
                    ? "No items match your filters."
                    : "No inventory items yet. Add your first item."}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const stock = parseFloat(item.currentStock)
                const minStock = parseFloat(item.lowStockThreshold)
                const status = getStockStatus(stock, minStock)
                const low = stock > 0 && stock <= minStock
                const out = stock <= 0

                return (
                  <tr key={item.id} className={`transition-colors ${status.row}`}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground text-sm">{item.name}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <StockLevelBar stock={stock} minStock={minStock} unit={item.unit} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {editingMinStockId === item.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editingMinStockVal}
                            onChange={(e) => setEditingMinStockVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleMinStockSave(item.id)
                              if (e.key === "Escape") setEditingMinStockId(null)
                            }}
                            autoFocus
                            min="0"
                            className="w-16 h-7 rounded-lg border border-primary/50 bg-background text-center text-sm font-medium focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => handleMinStockSave(item.id)}
                            className="p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <Check size={11} />
                          </button>
                          <button
                            onClick={() => setEditingMinStockId(null)}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMinStockEdit(item)}
                          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums hover:text-foreground transition-colors"
                        >
                          {item.lowStockThreshold}
                          <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium border ${status.bg}`}>
                        {(low || out) && <AlertTriangle size={10} />}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(item.updatedAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setAdjustingItem(item)}
                          className="text-xs font-medium text-primary hover:underline transition-colors"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {adjustingItem && (
        <AdjustModal
          key={adjustingItem.id}
          item={adjustingItem}
          onClose={() => setAdjustingItem(null)}
          onConfirm={handleAdjust}
          isPending={isPending}
        />
      )}

      <AddItemModal
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        onAdd={handleAdd}
        isPending={isPending}
      />
    </div>
  )
}