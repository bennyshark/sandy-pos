import { getProducts, getCategories } from "@/lib/actions/products"
import { Header } from "@/components/layout/header"
import { MenuClient } from "@/components/menu/menu-client"

export const metadata = { title: "Menu & Items" }

export default async function MenuPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  return (
    <>
      <Header
        title="Menu & Items"
        subtitle="Manage your products and categories"
      />
      <div className="flex-1 overflow-y-auto p-5">
        <MenuClient
          initialProducts={products as never}
          initialCategories={categories as never}
        />
      </div>
    </>
  )
}
