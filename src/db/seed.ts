/**
 * Sandy POS — Sales Seed (2025 → present)
 * Generates realistic randomised orders for dashboard testing.
 *
 * Run with:  npx tsx src/db/seed-sales.ts
 * (or add to package.json: "db:seed-sales": "tsx src/db/seed-sales.ts")
 *
 * Safe to run once — it checks for existing orders first.
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { db } from "."
import { orders, orderItems } from "./schema"
import { products } from "./schema"


// ─── Config ──────────────────────────────────────────────────────────────────
const START_DATE = new Date("2025-01-01T00:00:00+08:00")
const END_DATE   = new Date("2026-02-23T23:59:59+08:00")

// Avg orders per day by weekday (0=Sun … 6=Sat)
const DAILY_ORDER_VOLUME = [38, 22, 24, 26, 28, 32, 42] // Sun–Sat

// Hour weights (0–23) — café pattern: morning rush, lunch bump, slow afternoon
const HOUR_WEIGHTS = [
  0, 0, 0, 0, 0, 0,   // 0–5  closed / very quiet
  1, 4, 9, 8, 6, 7,   // 6–11 morning ramp + rush
  8, 6, 4, 3, 3, 3,   // 12–17 lunch + midday
  4, 5, 4, 2, 1, 0,   // 18–23 evening wind-down
]

const PAYMENT_METHODS = ["CASH", "CARD", "GCASH", "MAYA", "OTHER"] as const
const PAYMENT_WEIGHTS =  [35,     25,     25,      13,     2    ]   // %

const ORDER_TYPES = ["DINE_IN", "TAKEOUT", "DELIVERY"] as const
const TYPE_WEIGHTS = [55, 35, 10]

const TAX_RATE    = 0     // store default (taxEnabled: false)
const DISC_CHANCE = 0.06  // 6% of orders have a small discount

// ─── Helpers ─────────────────────────────────────────────────────────────────

function weightedRandom<T>(items: readonly T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickOrderHour(): number {
  return weightedRandom(
    Array.from({ length: 24 }, (_, i) => i),
    HOUR_WEIGHTS,
  )
}

/** How many orders to generate for a given date */
function ordersForDate(d: Date): number {
  const base   = DAILY_ORDER_VOLUME[d.getDay()]
  // Seasonal bump: Dec–Jan slightly busier, mid-week a bit quieter
  const month  = d.getMonth() // 0-based
  const boost  = [1.1, 1.05, 1, 1, 1, 0.95, 0.9, 0.9, 0.95, 1, 1.05, 1.15][month]
  const jitter = 0.7 + Math.random() * 0.6   // ±30% daily variance
  return Math.max(1, Math.round(base * boost * jitter))
}

let orderSeq = 1
function nextOrderNumber(date: Date): string {
  const prefix = date.toISOString().slice(0, 10).replace(/-/g, "")
  return `ORD-${prefix}-${String(orderSeq++).padStart(4, "0")}`
}

// ─── Main Seed ───────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding random sales data (2025 → Feb 2026)…")

  // Fetch all products so we can build realistic order items
  const allProducts = await db.select().from(products)
  if (allProducts.length === 0) {
    console.error("  ❌ No products found — run the main seed first (npm run db:seed)")
    process.exit(1)
  }
  console.log(`  ✓ Loaded ${allProducts.length} products`)

  // Build a per-day list of timestamps
  const allTimestamps: Date[] = []

  const cursor = new Date(START_DATE)
  while (cursor <= END_DATE) {
    const n = ordersForDate(cursor)
    for (let i = 0; i < n; i++) {
      const ts = new Date(cursor)
      ts.setHours(pickOrderHour(), randInt(0, 59), randInt(0, 59), 0)
      if (ts <= END_DATE) allTimestamps.push(ts)
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  allTimestamps.sort((a, b) => a.getTime() - b.getTime())
  console.log(`  ✓ Generated ${allTimestamps.length} order timestamps`)

  // Insert in batches of 200
  const BATCH = 200
  let total   = 0

  for (let i = 0; i < allTimestamps.length; i += BATCH) {
    const chunk = allTimestamps.slice(i, i + BATCH)

    const orderRows = chunk.map((ts) => {
      // Pick 1–5 random products (weighted toward smaller orders)
      const itemCount = weightedRandom([1, 2, 3, 4, 5], [20, 35, 25, 12, 8])
      const shuffled  = [...allProducts].sort(() => Math.random() - 0.5)
      const picked    = shuffled.slice(0, itemCount)

      // Build items
      const items = picked.map((p) => {
        const qty   = randInt(1, 3)
        const price = parseFloat(p.price)
        return {
          productId:    p.id,
          productName:  p.name,
          productPrice: price,
          quantity:     qty,
          subtotal:     +(price * qty).toFixed(2),
        }
      })

      const subtotal = +items.reduce((s, it) => s + it.subtotal, 0).toFixed(2)

      // Optional small discount
      let discountAmount = 0
      let discountType: "PERCENT" | "FIXED" = "FIXED"
      if (Math.random() < DISC_CHANCE) {
        discountType = Math.random() < 0.5 ? "PERCENT" : "FIXED"
        discountAmount = discountType === "PERCENT"
          ? +(subtotal * (randInt(5, 20) / 100)).toFixed(2)
          : randInt(20, 100)
      }

      const taxAmount = +(subtotal * TAX_RATE).toFixed(2)
      const total     = +Math.max(0, subtotal - discountAmount + taxAmount).toFixed(2)

      const paymentMethod = weightedRandom(PAYMENT_METHODS, PAYMENT_WEIGHTS)
      const type          = weightedRandom(ORDER_TYPES, TYPE_WEIGHTS)

      // Cash: tender a rounded-up amount
      let amountTendered: number | null = null
      let changeAmount: number | null   = null
      if (paymentMethod === "CASH") {
        const rounded = Math.ceil(total / 50) * 50
        amountTendered = Math.random() < 0.3 ? rounded + 50 : rounded
        changeAmount   = +(amountTendered - total).toFixed(2)
      }

      const completedAt = new Date(ts.getTime() + randInt(3, 18) * 60_000) // 3–18 min later

      return {
        order: {
          orderNumber:    nextOrderNumber(ts),
          type,
          status:         "COMPLETED" as const,
          tableNumber:    type === "DINE_IN" ? `T${randInt(1, 12)}` : null,
          customerName:   null,
          subtotal:       String(subtotal),
          taxRate:        String(TAX_RATE * 100),
          taxAmount:      String(taxAmount),
          discountAmount: String(discountAmount),
          discountType,
          total:          String(total),
          paymentMethod,
          amountTendered: amountTendered !== null ? String(amountTendered) : null,
          changeAmount:   changeAmount   !== null ? String(changeAmount)   : null,
          createdAt:      ts,
          completedAt,
        },
        items,
      }
    })

    // Insert orders for this batch, then items
    const insertedOrders = await db
      .insert(orders)
      .values(orderRows.map((r) => r.order))
      .returning({ id: orders.id })

    const itemRows = insertedOrders.flatMap((ord, idx) =>
      orderRows[idx].items.map((it) => ({
        orderId:      ord.id,
        productId:    it.productId,
        productName:  it.productName,
        productPrice: String(it.productPrice),
        quantity:     it.quantity,
        subtotal:     String(it.subtotal),
      }))
    )

    await db.insert(orderItems).values(itemRows)

    total += chunk.length
    if (total % 1000 < BATCH) {
      console.log(`  … ${total.toLocaleString()} orders inserted`)
    }
  }

  console.log(`\n✅ Done! ${total.toLocaleString()} orders + their items inserted.`)
  console.log("   Run: npm run dev  →  open Dashboard to explore the data.\n")
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Sales seed failed:", err)
  process.exit(1)
})