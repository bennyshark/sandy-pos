import {
  pgTable,
  text,
  numeric,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./auth"
import { products } from "./products"

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
])

export const orderTypeEnum = pgEnum("order_type", [
  "DINE_IN",
  "TAKEOUT",
  "DELIVERY",
])

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "CARD",
  "GCASH",
  "MAYA",
  "OTHER",
])

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderNumber: text("order_number").notNull().unique(),
  type: orderTypeEnum("type").default("DINE_IN").notNull(),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  tableNumber: text("table_number"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0").notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  discountType: text("discount_type", { enum: ["PERCENT", "FIXED"] }).default("FIXED"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  amountTendered: numeric("amount_tendered", { precision: 10, scale: 2 }),
  changeAmount: numeric("change_amount", { precision: 10, scale: 2 }),
  receiptToken: text("receipt_token")
    .unique()
    .$defaultFn(() => crypto.randomUUID()),
  notes: text("notes"),
  cashierId: text("cashier_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
})

export const orderItems = pgTable("order_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  productName: text("product_name").notNull(),
  productPrice: numeric("product_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
})

export const ordersRelations = relations(orders, ({ one, many }) => ({
  cashier: one(users, { fields: [orders.cashierId], references: [users.id] }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))
