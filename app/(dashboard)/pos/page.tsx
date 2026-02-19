import { getAvailableProducts, getCategories } from "@/lib/actions/products"
import { getStoreSettings } from "@/lib/actions/settings"
import { POSTerminal } from "@/components/pos/pos-terminal"

export const metadata = { title: "POS Terminal" }

export default async function POSPage() {
  const [products, categories, settings] = await Promise.all([
    getAvailableProducts(),
    getCategories(),
    getStoreSettings(),
  ])

  return (
    <POSTerminal
      products={products as never}
      categories={categories as never}
      settings={settings as never}
    />
  )
}
