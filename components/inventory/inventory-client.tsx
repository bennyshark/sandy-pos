"use client"
import { useState, useTransition } from "react"
import {
  createInventoryItem,
  restockItem,
  deleteInventoryItem,
} from "@/lib/actions/inventory"
import { Plus, PackagePlus, Trash2, AlertTriangle, History, X } from "lucide-react"
import type { InventoryItem } from "@/types"

type LogEntry = {
  id: string
  changeAmount: string
  reason: string
  notes: string | null
  createdAt: Date
  item?: { name: string; unit: string } | null
  createdByUser?: { name: string | null } | null
}

interface InventoryClientProps {
  initialItems: InventoryItem[]
  initialLogs: LogEntry[]
}

const UNITS = ["pcs", "g", "kg", "ml", "l", "oz", "lb", "cups"] as const

export function InventoryClient({
  initialItems,
  initialLogs,
}: InventoryClientProps) {
  const [items, setItems] = useState(initialItems)
  const [tab, setTab] = useState<"stock" | "logs">("stock")
  const [showAddForm, setShowAddForm] = useState(false)
  const [restockingId, setRestockingId] = useState<string | null>(null)
  const [restockAmount, setRestockAmount] = useState("")
  const [restockNotes, setRestockNotes] = useState("")
  const [isPending, startTransition] = useTransition()

  const [aName, setAName] = useState("")
  const [aUnit, setAUnit] = useState<(typeof UNITS)[number]>("pcs")
  const [aStock, setAStock] = useState("")
  const [aThreshold, setAThreshold] = useState("10")
  const [aCost, setACost] = useState("0")

  const isLow = (item: InventoryItem) =>
    parseFloat(item.currentStock) <= parseFloat(item.lowStockThreshold)

  const lowCount = items.filter(isLow).length

  const handleAdd = () => {
    if (!aName) return
    startTransition(async () => {
      const r = await createInventoryItem({
        name: aName,
        unit: aUnit,
        currentStock: aStock || "0",
        lowStockThreshold: aThreshold,
        costPerUnit: aCost,
      })
      if (r.success && r.data) {
        setItems((prev) => [...prev, r.data as InventoryItem])
        setShowAddForm(false)
        setAName("")
        setAStock("")
        setAThreshold("10")
        setACost("0")
      }
    })
  }

  const handleRestock = (id: string) => {
    if (!restockAmount) return
    startTransition(async () => {
      await restockItem(id, parseFloat(restockAmount), restockNotes)
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                currentStock: (
                  parseFloat(i.currentStock) + parseFloat(restockAmount)
                ).toFixed(2),
              }
            : i
        )
      )
      setRestockingId(null)
      setRestockAmount("")
      setRestockNotes("")
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this inventory item?")) return
    startTransition(async () => {
      await deleteInventoryItem(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    })
  }

  const inputClass =
    "w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"

  const Modal = ({
    show,
    onClose,
    title,
    subtitle,
    children,
    footer,
  }: {
    show: boolean
    onClose: () => void
    title: string
    subtitle?: string
    children: React.ReactNode
    footer: React.ReactNode
  }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl shadow-2xl w-full max-w-sm border border-border animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-semibold text-foreground text-base">{title}</h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-xl transition-colors">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
          <div className="p-5 space-y-4">{children}</div>
          <div className="p-5 border-t border-border flex gap-3">{footer}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 items-center flex-wrap">
        {(
          [
            { value: "stock", label: "Stock Levels" },
            { value: "logs", label: "Movement Log", icon: History },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              tab === value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            {Icon && <Icon size={14} />}
            {label}
            {value === "stock" && lowCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {lowCount}
              </span>
            )}
          </button>
        ))}

        {tab === "stock" && (
          <button
            onClick={() => setShowAddForm(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-md"
          >
            <Plus size={16} />
            Add Item
          </button>
        )}
      </div>

      {/* Stock table */}
      {tab === "stock" && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Item", "Unit", "Stock", "Low Threshold", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${
                        h === "Item" ? "text-left" : "text-right"
                      } ${h === "" ? "" : ""}`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-14 text-muted-foreground text-sm"
                  >
                    <p className="text-3xl mb-2">📦</p>
                    No inventory items yet. Add your first item.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const low = isLow(item)
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        low
                          ? "bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground text-sm">
                          {item.name}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          {item.unit}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`font-semibold text-sm ${
                            low
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground"
                          }`}
                        >
                          {parseFloat(item.currentStock).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm text-muted-foreground">
                          {item.lowStockThreshold}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {low ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full font-medium">
                            <AlertTriangle size={10} />
                            Low
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setRestockingId(item.id)
                              setRestockAmount("")
                              setRestockNotes("")
                            }}
                            className="p-1.5 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-colors"
                            title="Restock"
                          >
                            <PackagePlus size={14} />
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
      )}

      {/* Logs table */}
      {tab === "logs" && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Item", "Change", "Reason", "Notes", "Date"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${
                      i === 0 ? "text-left" : i === 4 ? "text-right" : "text-left"
                    } ${i >= 3 ? "hidden md:table-cell" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-14 text-muted-foreground text-sm"
                  >
                    No inventory movements yet
                  </td>
                </tr>
              ) : (
                initialLogs.map((log) => {
                  const isPositive = parseFloat(log.changeAmount) > 0
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-foreground">
                          {log.item?.name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.item?.unit}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-semibold text-sm ${
                            isPositive
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-500"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {log.changeAmount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
                          {log.reason}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-xs text-muted-foreground">
                          {log.notes ?? "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-right hidden md:table-cell">
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString("en-PH")}
                        </p>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Restock Modal */}
      <Modal
        show={!!restockingId}
        onClose={() => setRestockingId(null)}
        title="Restock Item"
        subtitle={items.find((i) => i.id === restockingId)?.name}
        footer={
          <>
            <button
              onClick={() => setRestockingId(null)}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRestock(restockingId!)}
              disabled={!restockAmount || isPending}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Restock"}
            </button>
          </>
        }
      >
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Quantity to Add *
          </label>
          <input
            type="number"
            value={restockAmount}
            onChange={(e) => setRestockAmount(e.target.value)}
            className={inputClass}
            placeholder="e.g. 100"
            min="0"
            step="0.01"
            autoFocus
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Notes
          </label>
          <input
            value={restockNotes}
            onChange={(e) => setRestockNotes(e.target.value)}
            className={inputClass}
            placeholder="Supplier, batch number, etc."
          />
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="New Inventory Item"
        footer={
          <>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!aName || isPending}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? "Adding…" : "Add Item"}
            </button>
          </>
        }
      >
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Name *
          </label>
          <input
            value={aName}
            onChange={(e) => setAName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Coffee Beans"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Unit
            </label>
            <select
              value={aUnit}
              onChange={(e) =>
                setAUnit(e.target.value as (typeof UNITS)[number])
              }
              className={inputClass}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Initial Stock
            </label>
            <input
              type="number"
              value={aStock}
              onChange={(e) => setAStock(e.target.value)}
              className={inputClass}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Low Stock Alert
            </label>
            <input
              type="number"
              value={aThreshold}
              onChange={(e) => setAThreshold(e.target.value)}
              className={inputClass}
              placeholder="10"
              min="0"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Cost/Unit (₱)
            </label>
            <input
              type="number"
              value={aCost}
              onChange={(e) => setACost(e.target.value)}
              className={inputClass}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
