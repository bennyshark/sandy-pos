import {
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./auth"
import { products } from "./products"

export const unitEnum = pgEnum("unit_type", [
  "g",
  "kg",
  "ml",
  "l",
  "pcs",
  "oz",
  "lb",
  "cups",
])

export const inventoryReasonEnum = pgEnum("inventory_reason", [
  "SALE",
  "RESTOCK",
  "ADJUSTMENT",
  "WASTE",
  "INITIAL",
])

export const inventoryItems = pgTable("inventory_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  unit: unitEnum("unit").default("pcs").notNull(),
  currentStock: numeric("current_stock", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  lowStockThreshold: numeric("low_stock_threshold", { precision: 10, scale: 2 })
    .default("10")
    .notNull(),
  costPerUnit: numeric("cost_per_unit", { precision: 10, scale: 2 })
    .default("0")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const productIngredients = pgTable("product_ingredients", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  inventoryItemId: text("inventory_item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  quantityUsed: numeric("quantity_used", { precision: 10, scale: 4 }).notNull(),
})

export const inventoryLogs = pgTable("inventory_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  inventoryItemId: text("inventory_item_id")
    .notNull()
    .references(() => inventoryItems.id),
  changeAmount: numeric("change_amount", { precision: 10, scale: 2 }).notNull(),
  reason: inventoryReasonEnum("reason").notNull(),
  referenceOrderId: text("reference_order_id"),
  notes: text("notes"),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ many }) => ({
    ingredients: many(productIngredients),
    logs: many(inventoryLogs),
  })
)

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryLogs.inventoryItemId],
    references: [inventoryItems.id],
  }),
  createdByUser: one(users, {
    fields: [inventoryLogs.createdBy],
    references: [users.id],
  }),
}))
