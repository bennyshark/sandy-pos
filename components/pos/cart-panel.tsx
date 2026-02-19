"use client"
import { useState } from "react"
import { useCartStore } from "@/stores/cart"
import { formatCurrency } from "@/lib/utils"
import { Minus, Plus, Trash2, ShoppingCart, Tag } from "lucide-react"
import { PaymentModal } from "./payment-modal"
import type { StoreSettings, OrderType, DiscountType } from "@/types"

interface CartPanelProps {
  settings: StoreSettings
}

const ORDER_TYPES: { value: OrderType; label: string; emoji: string }[] = [
  { value: "DINE_IN",  label: "Dine In",  emoji: "🪑" },
  { value: "TAKEOUT",  label: "Takeout",  emoji: "🛍️" },
  { value: "DELIVERY", label: "Delivery", emoji: "🛵" },
]

export function CartPanel({ settings }: CartPanelProps) {
  const [showPayment, setShowPayment] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountInput, setDiscountInput] = useState("")
  const [discountTypeInput, setDiscountTypeInput] =
    useState<DiscountType>("FIXED")

  const {
    items,
    orderType,
    tableNumber,
    updateQuantity,
    removeItem,
    setOrderType,
    setTableNumber,
    subtotal,
    total,
    clearCart,
    discountAmount,
    discountType,
    setDiscount,
  } = useCartStore()

  const taxRate = settings.taxEnabled ? parseFloat(settings.taxRate) : 0
  const sub = subtotal()
  const disc =
    discountType === "PERCENT"
      ? (sub * discountAmount) / 100
      : discountAmount
  const tax = Math.max(0, sub - disc) * (taxRate / 100)
  const tot = total(taxRate)

  const applyDiscount = () => {
    const val = parseFloat(discountInput) || 0
    setDiscount(val, discountTypeInput)
    setShowDiscount(false)
  }

  return (
    <>
      <div className="flex flex-col bg-card h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Order Type
          </p>
          <div className="flex gap-1.5">
            {ORDER_TYPES.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setOrderType(value)}
                className={`
                  flex-1 py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-0.5 transition-all
                  ${
                    orderType === value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }
                `}
              >
                <span className="text-base leading-none">{emoji}</span>
                {label}
              </button>
            ))}
          </div>

          {orderType === "DINE_IN" && (
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Table number (optional)"
              className="mt-2 w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <ShoppingCart
                size={44}
                className="text-muted-foreground/20 mb-4"
              />
              <p className="text-muted-foreground text-sm font-medium">
                Cart is empty
              </p>
              <p className="text-muted-foreground/50 text-xs mt-1.5">
                Select items from the menu
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="bg-background rounded-xl p-3 border border-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground flex-1 leading-tight">
                    {item.name}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      className="w-6 h-6 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      className="w-6 h-6 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-primary">
                    {formatCurrency(
                      item.price * item.quantity,
                      settings.currencySymbol
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals + Actions */}
        {items.length > 0 && (
          <div className="border-t border-border px-4 py-4 shrink-0 space-y-3">
            {/* Discount toggle */}
            <button
              onClick={() => setShowDiscount(!showDiscount)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Tag size={12} />
              {discountAmount > 0
                ? `Discount: ${discountType === "PERCENT" ? `${discountAmount}%` : formatCurrency(discountAmount, settings.currencySymbol)}`
                : "Add Discount"}
            </button>

            {showDiscount && (
              <div className="flex gap-2">
                <select
                  value={discountTypeInput}
                  onChange={(e) =>
                    setDiscountTypeInput(e.target.value as DiscountType)
                  }
                  className="bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="FIXED">₱ Fixed</option>
                  <option value="PERCENT">% Percent</option>
                </select>
                <input
                  type="number"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  min="0"
                />
                <button
                  onClick={applyDiscount}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Line items */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(sub, settings.currencySymbol)}</span>
              </div>
              {disc > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>
                    -{formatCurrency(disc, settings.currencySymbol)}
                  </span>
                </div>
              )}
              {settings.taxEnabled && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({settings.taxRate}%)</span>
                  <span>{formatCurrency(tax, settings.currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary text-lg">
                  {formatCurrency(tot, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="p-3 bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-xl transition-colors"
                title="Clear cart"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setShowPayment(true)}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
              >
                Charge {formatCurrency(tot, settings.currencySymbol)}
              </button>
            </div>
          </div>
        )}
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={tot}
        settings={settings}
      />
    </>
  )
}
