"use client"
import { useState, useTransition } from "react"
import { useCartStore } from "@/stores/cart"
import { createOrder } from "@/lib/actions/orders"
import { formatCurrency } from "@/lib/utils"
import { X, CheckCircle, ExternalLink } from "lucide-react"
import type { PaymentMethod, StoreSettings } from "@/types"

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] =
  [
    { value: "CASH",  label: "Cash",  icon: "💵" },
    { value: "CARD",  label: "Card",  icon: "💳" },
    { value: "GCASH", label: "GCash", icon: "📱" },
    { value: "MAYA",  label: "Maya",  icon: "💜" },
  ]

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  total: number
  settings: StoreSettings
}

export function PaymentModal({
  open,
  onClose,
  total,
  settings,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [tendered, setTendered] = useState("")
  const [isPending, startTransition] = useTransition()
  const [receiptToken, setReceiptToken] = useState<string | null>(null)

  const {
    items,
    orderType,
    tableNumber,
    customerName,
    customerEmail,
    notes,
    discountAmount,
    discountType,
    clearCart,
  } = useCartStore()

  const tenderedNum = parseFloat(tendered) || 0
  const change = method === "CASH" ? Math.max(0, tenderedNum - total) : 0
  const sym = settings.currencySymbol

  const handleNumpad = (val: string) => {
    if (val === "⌫") {
      setTendered((prev) => prev.slice(0, -1))
    } else if (val === "." && tendered.includes(".")) {
      return
    } else {
      setTendered((prev) => (prev.length < 10 ? prev + val : prev))
    }
  }

  const quickAmounts = [
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
  ].filter((v, i, a) => a.indexOf(v) === i)

  const handleCharge = () => {
    startTransition(async () => {
      const result = await createOrder({
        items,
        orderType,
        tableNumber: tableNumber || undefined,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        paymentMethod: method,
        amountTendered:
          method === "CASH" && tenderedNum > 0 ? tenderedNum : undefined,
        discountAmount,
        discountType,
        notes: notes || undefined,
      })
      if (result.success && result.receiptToken) {
        setReceiptToken(result.receiptToken)
        clearCart()
      }
    })
  }

  const handleClose = () => {
    setReceiptToken(null)
    setTendered("")
    setMethod("CASH")
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md border border-border animate-fade-in">
        {receiptToken ? (
          /* ── Success ── */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h2
              className="text-2xl font-bold text-foreground mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Order Complete!
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Payment of{" "}
              <span className="font-semibold text-primary">
                {formatCurrency(total, sym)}
              </span>{" "}
              received
            </p>

            {method === "CASH" && change > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-2xl p-4 mb-6">
                <p className="text-green-800 dark:text-green-400 text-sm font-medium mb-0.5">
                  Change Due
                </p>
                <p className="text-green-700 dark:text-green-300 font-bold text-3xl">
                  {formatCurrency(change, sym)}
                </p>
              </div>
            )}

            <a
              href={`/receipt/${receiptToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors mb-3 text-sm"
            >
              <ExternalLink size={15} />
              View & Share Receipt
            </a>

            <button
              onClick={handleClose}
              className="block w-full mt-2 py-3 bg-muted hover:bg-accent text-foreground rounded-xl font-medium transition-colors text-sm"
            >
              Start New Order
            </button>
          </div>
        ) : (
          /* ── Payment Form ── */
          <>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Amount Due
                </p>
                <p
                  className="text-3xl font-bold text-primary mt-0.5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {formatCurrency(total, sym)}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Payment Method */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Payment Method
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => setMethod(value)}
                      className={`
                        py-3 rounded-xl flex flex-col items-center gap-1 text-xs font-medium transition-all
                        ${
                          method === value
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                        }
                      `}
                    >
                      <span className="text-xl">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash numpad */}
              {method === "CASH" && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Amount Tendered
                  </p>

                  {/* Display */}
                  <div className="bg-muted rounded-2xl px-4 py-3 text-right mb-2 min-h-[3.5rem] flex items-center justify-end">
                    {tendered ? (
                      <span className="text-2xl font-bold text-foreground">
                        {sym}
                        {tendered}
                      </span>
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground/40">
                        {sym}0.00
                      </span>
                    )}
                  </div>

                  {/* Change */}
                  {tenderedNum >= total && change >= 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-2.5 mb-3 flex justify-between items-center">
                      <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                        Change
                      </span>
                      <span className="text-green-700 dark:text-green-400 font-bold text-sm">
                        {formatCurrency(change, sym)}
                      </span>
                    </div>
                  )}

                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map(
                      (k) => (
                        <button
                          key={k}
                          onClick={() => handleNumpad(k)}
                          className="py-3.5 bg-background border border-border rounded-xl font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-100 active:scale-95 text-sm"
                        >
                          {k}
                        </button>
                      )
                    )}
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-1.5 mt-1.5">
                    {quickAmounts.map((v) => (
                      <button
                        key={v}
                        onClick={() => setTendered(v.toFixed(2))}
                        className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-xl text-xs font-medium hover:bg-accent transition-colors"
                      >
                        {formatCurrency(v, sym)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handleCharge}
                disabled={
                  isPending ||
                  (method === "CASH" && tenderedNum < total)
                }
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold text-base transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isPending ? "Processing..." : "Complete Order"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
