import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem, OrderType, DiscountType } from "@/types"

interface CartState {
  items: CartItem[]
  orderType: OrderType
  tableNumber: string
  customerName: string
  customerEmail: string
  notes: string
  discountAmount: number
  discountType: DiscountType

  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateItemNotes: (productId: string, notes: string) => void
  setOrderType: (type: OrderType) => void
  setTableNumber: (table: string) => void
  setCustomerName: (name: string) => void
  setCustomerEmail: (email: string) => void
  setNotes: (notes: string) => void
  setDiscount: (amount: number, type: DiscountType) => void
  clearCart: () => void

  subtotal: () => number
  total: (taxRate?: number) => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: "DINE_IN",
      tableNumber: "",
      customerName: "",
      customerEmail: "",
      notes: "",
      discountAmount: 0,
      discountType: "FIXED",

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }))
      },

      updateItemNotes: (productId, notes) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, notes } : i
          ),
        }))
      },

      setOrderType: (orderType) => set({ orderType }),
      setTableNumber: (tableNumber) => set({ tableNumber }),
      setCustomerName: (customerName) => set({ customerName }),
      setCustomerEmail: (customerEmail) => set({ customerEmail }),
      setNotes: (notes) => set({ notes }),
      setDiscount: (discountAmount, discountType) =>
        set({ discountAmount, discountType }),

      clearCart: () =>
        set({
          items: [],
          tableNumber: "",
          customerName: "",
          customerEmail: "",
          notes: "",
          discountAmount: 0,
          discountType: "FIXED",
          orderType: "DINE_IN",
        }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      total: (taxRate = 0) => {
        const sub = get().subtotal()
        const { discountAmount, discountType } = get()
        const discounted =
          discountType === "PERCENT"
            ? sub - (sub * discountAmount) / 100
            : sub - discountAmount
        const taxable = Math.max(0, discounted)
        return taxable + taxable * (taxRate / 100)
      },

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "sandy-cart",
      partialize: (state) => ({
        items: state.items,
        orderType: state.orderType,
        tableNumber: state.tableNumber,
        discountAmount: state.discountAmount,
        discountType: state.discountType,
      }),
    }
  )
)
