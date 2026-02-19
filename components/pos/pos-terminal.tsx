"use client"
import { useState } from "react"
import { CategoryTabs } from "./category-tabs"
import { MenuGrid } from "./menu-grid"
import { CartPanel } from "./cart-panel"
import type { Product, Category, StoreSettings } from "@/types"

interface POSTerminalProps {
  products: Product[]
  categories: Category[]
  settings: StoreSettings
}

export function POSTerminal({
  products,
  categories,
  settings,
}: POSTerminalProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const filtered =
    activeCategoryId
      ? products.filter((p) => p.categoryId === activeCategoryId)
      : products

  return (
    <div className="pos-grid">
      {/* Left: Menu */}
      <div className="flex flex-col overflow-hidden border-r border-border">
        <CategoryTabs
          categories={categories}
          activeId={activeCategoryId}
          onChange={setActiveCategoryId}
        />
        <MenuGrid products={filtered} settings={settings} />
      </div>

      {/* Right: Cart */}
      <div className="hidden lg:flex flex-col overflow-hidden">
        <CartPanel settings={settings} />
      </div>
    </div>
  )
}
