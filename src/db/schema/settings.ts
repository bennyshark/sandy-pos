import {
  pgTable,
  text,
  numeric,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core"

export const storeSettings = pgTable("store_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  storeName: text("store_name").default("Sandy Café").notNull(),
  storeAddress: text("store_address"),
  storePhone: text("store_phone"),
  storeEmail: text("store_email"),
  logoUrl: text("logo_url"),
  currency: text("currency").default("PHP").notNull(),
  currencySymbol: text("currency_symbol").default("₱").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0").notNull(),
  taxEnabled: boolean("tax_enabled").default(false).notNull(),
  receiptFooter: text("receipt_footer").default("Thank you for dining with us! ☕"),
  receiptHeader: text("receipt_header"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
