export type UserRole = "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN"
export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"
export type OrderType = "DINE_IN" | "TAKEOUT" | "DELIVERY"
export type PaymentMethod = "CASH" | "CARD" | "GCASH" | "MAYA" | "OTHER"
export type DiscountType = "PERCENT" | "FIXED"
export type InventoryUnit = "g" | "kg" | "ml" | "l" | "pcs" | "oz" | "lb" | "cups"
export type InventoryReason = "SALE" | "RESTOCK" | "ADJUSTMENT" | "WASTE" | "INITIAL"

export interface Category {
  id: string
  name: string
  color: string
  emoji: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
}

export interface Product {
  id: string
  categoryId: string | null
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isAvailable: boolean
  trackInventory: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  category?: Category | null
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  notes?: string
}

export interface OrderWithItems {
  id: string
  orderNumber: string
  type: OrderType
  status: OrderStatus
  tableNumber: string | null
  customerName: string | null
  customerEmail: string | null
  subtotal: string
  taxRate: string
  taxAmount: string
  discountAmount: string
  discountType: DiscountType | null
  total: string
  paymentMethod: PaymentMethod | null
  amountTendered: string | null
  changeAmount: string | null
  receiptToken: string | null
  notes: string | null
  cashierId: string | null
  createdAt: Date
  completedAt: Date | null
  items: {
    id: string
    productName: string
    productPrice: string
    quantity: number
    subtotal: string
    notes: string | null
  }[]
}

export interface DashboardStats {
  todayRevenue: number
  todayOrders: number
  avgOrderValue: number
  topItems: { name: string; count: number; revenue: number }[]
  revenueByDay: { date: string; revenue: number }[]
  orderTypeBreakdown: { type: string; count: number }[]
  recentOrders: OrderWithItems[]
}

export interface InventoryItem {
  id: string
  name: string
  unit: InventoryUnit
  currentStock: string
  lowStockThreshold: string
  costPerUnit: string
  createdAt: Date
  updatedAt: Date
}

export interface StoreSettings {
  id: string
  storeName: string
  storeAddress: string | null
  storePhone: string | null
  storeEmail: string | null
  logoUrl: string | null
  currency: string
  currencySymbol: string
  taxRate: string
  taxEnabled: boolean
  receiptFooter: string | null
  receiptHeader: string | null
}
