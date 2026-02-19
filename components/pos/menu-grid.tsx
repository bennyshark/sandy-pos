"use client"
import { useCartStore } from "@/stores/cart"
import { formatCurrency } from "@/lib/utils"
import { Plus } from "lucide-react"
import type { Product, StoreSettings } from "@/types"

interface MenuGridProps {
  products: Product[]
  settings: StoreSettings
}

export function MenuGrid({ products, settings }: MenuGridProps) {
  const { addItem, items } = useCartStore()

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🍽️</p>
          <p className="text-muted-foreground font-medium">
            No items in this category
          </p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            Add products in Menu &amp; Items
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {products.map((product) => {
          const cartItem = items.find((i) => i.productId === product.id)
          const qty = cartItem?.quantity ?? 0

          return (
            <button
              key={product.id}
              onClick={() =>
                addItem({
                  productId: product.id,
                  name: product.name,
                  price: parseFloat(product.price),
                })
              }
              className="
                relative bg-card hover:bg-accent rounded-2xl p-4 text-left
                border border-border hover:border-primary/40
                transition-all duration-150 active:scale-95
                shadow-sm hover:shadow-md group
              "
            >
              {/* Qty badge */}
              {qty > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center justify-center shadow-lg z-10">
                  {qty}
                </span>
              )}

              {/* Image / emoji */}
              <div className="w-full aspect-square rounded-xl bg-muted mb-3 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">
                    {product.category?.emoji ?? "🍽️"}
                  </span>
                )}
              </div>

              <p className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
                {product.name}
              </p>

              {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                  {product.description}
                </p>
              )}

              <p className="text-primary font-bold text-sm">
                {formatCurrency(product.price, settings.currencySymbol)}
              </p>

              {/* Add button */}
              <div className="absolute bottom-3 right-3 w-7 h-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-md">
                <Plus size={13} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
