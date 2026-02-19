"use client"
import { useState, useTransition } from "react"
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
  createCategory,
  deleteCategory,
} from "@/lib/actions/products"
import { Plus, Pencil, Trash2, Eye, EyeOff, Tag, X } from "lucide-react"
import type { Product, Category } from "@/types"

interface MenuClientProps {
  initialProducts: Product[]
  initialCategories: Category[]
}

export function MenuClient({
  initialProducts,
  initialCategories,
}: MenuClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [categories, setCategories] = useState(initialCategories)
  const [tab, setTab] = useState<"products" | "categories">("products")
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isPending, startTransition] = useTransition()

  // Product form state
  const [pName, setPName] = useState("")
  const [pDescription, setPDescription] = useState("")
  const [pPrice, setPPrice] = useState("")
  const [pCategoryId, setPCategoryId] = useState("")
  const [pAvailable, setPAvailable] = useState(true)

  // Category form state
  const [cName, setCName] = useState("")
  const [cEmoji, setCEmoji] = useState("☕")

  const openEditProduct = (p: Product) => {
    setEditingProduct(p)
    setPName(p.name)
    setPDescription(p.description ?? "")
    setPPrice(p.price)
    setPCategoryId(p.categoryId ?? "")
    setPAvailable(p.isAvailable)
    setShowProductForm(true)
  }

  const resetProductForm = () => {
    setEditingProduct(null)
    setPName("")
    setPDescription("")
    setPPrice("")
    setPCategoryId("")
    setPAvailable(true)
    setShowProductForm(false)
  }

  const handleSaveProduct = () => {
    if (!pName || !pPrice) return
    startTransition(async () => {
      const data = {
        name: pName,
        description: pDescription || null,
        price: pPrice,
        categoryId: pCategoryId || null,
        isAvailable: pAvailable,
      }
      if (editingProduct) {
        const r = await updateProduct(editingProduct.id, data)
        if (r.success) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === editingProduct.id ? { ...p, ...data } : p
            )
          )
        }
      } else {
        const r = await createProduct(data)
        if (r.success && r.data) {
          setProducts((prev) => [...prev, r.data as Product])
        }
      }
      resetProductForm()
    })
  }

  const handleDeleteProduct = (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return
    startTransition(async () => {
      await deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    })
  }

  const handleToggleAvailability = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleProductAvailability(id, !current)
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, isAvailable: !current } : p
        )
      )
    })
  }

  const handleSaveCategory = () => {
    if (!cName) return
    startTransition(async () => {
      const r = await createCategory({ name: cName, emoji: cEmoji })
      if (r.success && r.data) {
        setCategories((prev) => [...prev, r.data as Category])
        setCName("")
        setCEmoji("☕")
        setShowCategoryForm(false)
      }
    })
  }

  const handleDeleteCategory = (id: string) => {
    if (!confirm("Delete this category? Products will become uncategorized."))
      return
    startTransition(async () => {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    })
  }

  const Modal = ({
    show,
    onClose,
    title,
    children,
    footer,
  }: {
    show: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer: React.ReactNode
  }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md border border-border animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold text-foreground text-base">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-xl transition-colors"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
          <div className="p-5 space-y-4">{children}</div>
          <div className="p-5 border-t border-border flex gap-3">{footer}</div>
        </div>
      </div>
    )
  }

  const Field = ({
    label,
    children,
  }: {
    label: string
    children: React.ReactNode
  }) => (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  )

  const inputClass =
    "w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["products", "categories"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground border border-border hover:bg-muted"
            }`}
          >
            {t === "products" ? "Products" : "Categories"}
            <span className="ml-2 text-xs opacity-60">
              {t === "products" ? products.length : categories.length}
            </span>
          </button>
        ))}

        <button
          onClick={() =>
            tab === "products"
              ? setShowProductForm(true)
              : setShowCategoryForm(true)
          }
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-md"
        >
          <Plus size={16} />
          Add {tab === "products" ? "Product" : "Category"}
        </button>
      </div>

      {/* Products grid */}
      {tab === "products" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="font-medium">No products yet</p>
              <p className="text-sm mt-1">Click "Add Product" to get started</p>
            </div>
          )}
          {products.map((p) => (
            <div
              key={p.id}
              className={`bg-card rounded-2xl border ${
                p.isAvailable ? "border-border" : "border-border/40 opacity-55"
              } p-4 shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <span className="text-2xl">
                    {p.category?.emoji ?? "🍽️"}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleAvailability(p.id, p.isAvailable)}
                    className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={p.isAvailable ? "Hide from POS" : "Show in POS"}
                  >
                    {p.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => openEditProduct(p)}
                    className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-1.5 rounded-xl hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="font-semibold text-foreground text-sm leading-tight mb-0.5">
                {p.name}
              </p>
              {p.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                  {p.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-primary font-bold text-sm">
                  ₱{p.price}
                </span>
                {p.category && (
                  <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                    <Tag size={9} />
                    {p.category.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories grid */}
      {tab === "categories" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-3">📂</p>
              <p className="font-medium">No categories yet</p>
            </div>
          )}
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <span className="text-3xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">
                  {c.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {products.filter((p) => p.categoryId === c.id).length} items
                </p>
              </div>
              <button
                onClick={() => handleDeleteCategory(c.id)}
                className="p-1.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <Modal
        show={showProductForm}
        onClose={resetProductForm}
        title={editingProduct ? "Edit Product" : "New Product"}
        footer={
          <>
            <button
              onClick={resetProductForm}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProduct}
              disabled={!pName || !pPrice || isPending}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isPending
                ? "Saving…"
                : editingProduct
                ? "Save Changes"
                : "Add Product"}
            </button>
          </>
        }
      >
        <Field label="Name *">
          <input
            value={pName}
            onChange={(e) => setPName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Caramel Latte"
            autoFocus
          />
        </Field>
        <Field label="Description">
          <textarea
            value={pDescription}
            onChange={(e) => setPDescription(e.target.value)}
            rows={2}
            className={inputClass + " resize-none"}
            placeholder="Optional description"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₱) *">
            <input
              type="number"
              value={pPrice}
              onChange={(e) => setPPrice(e.target.value)}
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="0.00"
            />
          </Field>
          <Field label="Category">
            <select
              value={pCategoryId}
              onChange={(e) => setPCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={pAvailable}
            onChange={(e) => setPAvailable(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm text-foreground">Available in POS</span>
        </label>
      </Modal>

      {/* Category Form Modal */}
      <Modal
        show={showCategoryForm}
        onClose={() => {
          setShowCategoryForm(false)
          setCName("")
        }}
        title="New Category"
        footer={
          <>
            <button
              onClick={() => {
                setShowCategoryForm(false)
                setCName("")
              }}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCategory}
              disabled={!cName || isPending}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create Category"}
            </button>
          </>
        }
      >
        <Field label="Name *">
          <input
            value={cName}
            onChange={(e) => setCName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Hot Drinks"
            autoFocus
          />
        </Field>
        <Field label="Emoji">
          <input
            value={cEmoji}
            onChange={(e) => setCEmoji(e.target.value)}
            className={inputClass}
            placeholder="☕"
          />
        </Field>
      </Modal>
    </div>
  )
}
