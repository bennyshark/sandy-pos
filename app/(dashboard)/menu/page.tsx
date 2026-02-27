import { Suspense } from "react"
import { getProducts, getCategories } from "@/lib/actions/products"
import { Header } from "@/components/layout/header"
import { MenuClient } from "@/components/menu/menu-client"
import { MenuPageSkeleton } from "@/components/ui/skeletons"

export const metadata = { title: "Menu & Items" }

async function MenuData() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])
  return (
    <MenuClient
      initialProducts={products as never}
      initialCategories={categories as never}
    />
  )
}

export default function MenuPage() {
  return (
    <>
      <Header title="Menu & Items" subtitle="Manage your products and categories" />
      <div className="flex-1 overflow-y-auto p-5">
        <Suspense fallback={<MenuPageSkeleton />}>
          <MenuData />
        </Suspense>
      </div>
    </>
  )
}