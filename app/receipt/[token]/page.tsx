import { getOrderByToken } from "@/lib/actions/orders"
import { getStoreSettings } from "@/lib/actions/settings"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const order = await getOrderByToken(token)
  if (!order) return { title: "Receipt Not Found" }
  return { title: `Receipt ${order.orderNumber}` }
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [order, settings] = await Promise.all([
    getOrderByToken(token),
    getStoreSettings(),
  ])

  if (!order) notFound()

  const sym = settings.currencySymbol
  const receiptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/receipt/${token}`

  const TYPE_LABELS: Record<string, string> = {
    DINE_IN: "Dine In",
    TAKEOUT: "Takeout",
    DELIVERY: "Delivery",
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-10 px-4">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-8 text-center"
          style={{
            background: "linear-gradient(135deg, #c2903a 0%, #835b22 100%)",
          }}
        >
          <div className="text-4xl mb-3">☕</div>
          <h1
            className="text-white font-bold text-2xl leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {settings.storeName}
          </h1>
          {settings.storeAddress && (
            <p className="text-white/70 text-xs mt-2">{settings.storeAddress}</p>
          )}
          {settings.storePhone && (
            <p className="text-white/70 text-xs">{settings.storePhone}</p>
          )}
        </div>

        {/* Order info */}
        <div className="px-6 py-5 border-b border-border space-y-2.5">
          {settings.receiptHeader && (
            <p className="text-center text-xs text-muted-foreground italic mb-3">
              {settings.receiptHeader}
            </p>
          )}

          {[
            ["Order #", order.orderNumber],
            ["Date", formatDateTime(order.createdAt)],
            ["Type", TYPE_LABELS[order.type] ?? order.type],
            ...(order.tableNumber
              ? [["Table", order.tableNumber]]
              : []),
            ...(order.paymentMethod
              ? [["Payment", order.paymentMethod]]
              : []),
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="px-6 py-5 border-b border-border">
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start gap-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.productName}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    ×{item.quantity}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(item.subtotal, sym)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="px-6 py-5 border-b border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal, sym)}</span>
          </div>

          {parseFloat(order.discountAmount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(order.discountAmount, sym)}</span>
            </div>
          )}

          {parseFloat(order.taxAmount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax ({order.taxRate}%)
              </span>
              <span>{formatCurrency(order.taxAmount, sym)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-lg border-t border-border pt-3 mt-1">
            <span className="text-foreground">Total</span>
            <span
              className="text-primary"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formatCurrency(order.total, sym)}
            </span>
          </div>

          {order.amountTendered &&
            parseFloat(order.amountTendered) > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash Tendered</span>
                  <span>{formatCurrency(order.amountTendered, sym)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-green-600">
                  <span>Change</span>
                  <span>
                    {formatCurrency(order.changeAmount ?? "0", sym)}
                  </span>
                </div>
              </>
            )}
        </div>

        {/* Footer */}
        <div className="px-6 py-7 text-center space-y-4">
          {settings.receiptFooter && (
            <p className="text-muted-foreground text-sm italic">
              {settings.receiptFooter}
            </p>
          )}
          <div className="border-t border-border pt-4 space-y-1">
            <p className="text-xs text-muted-foreground/50">
              Digital receipt by Sandy POS
            </p>
            <p className="text-[9px] text-muted-foreground/30 break-all font-mono">
              {receiptUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
