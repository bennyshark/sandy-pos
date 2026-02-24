"use server";

import { db } from "@/src/db";
import { orders, orderItems } from "@/src/db/schema/orders";
import { inventoryItems, productIngredients, inventoryLogs } from "@/src/db/schema/inventory";
import { storeSettings } from "@/src/db/schema/settings";
import { categories, products } from "@/src/db/schema/products";
import { users } from "@/src/db/schema/auth";// adjust path if needed
import { eq, ne, desc, and, gte, sql, count, inArray, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { generateOrderNumber } from "@/lib/utils";
import type { CartItem, OrderType, PaymentMethod, DiscountType } from "@/types";

interface CreateOrderInput {
  items: CartItem[];
  orderType: OrderType;
  tableNumber?: string;
  customerName?: string;
  customerEmail?: string;
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  discountAmount?: number;
  discountType?: DiscountType;
  notes?: string;
}

export async function createOrder(input: CreateOrderInput) {
  const session = await auth();
  const cashierId = session?.user?.id ?? null;

  const [settings] = await db.select().from(storeSettings).limit(1);
  const taxRate = settings?.taxEnabled ? parseFloat(settings.taxRate ?? "0") : 0;

  const subtotal = input.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = input.discountAmount ?? 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;
  const changeAmount = input.amountTendered ? Math.max(0, input.amountTendered - total) : 0;

  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      type: input.orderType,
      status: "PENDING",
      tableNumber: input.tableNumber ?? null,
      customerName: input.customerName ?? null,
      customerEmail: input.customerEmail ?? null,
      subtotal: subtotal.toFixed(2),
      taxRate: taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      discountType: input.discountType ?? "FIXED",
      total: total.toFixed(2),
      paymentMethod: input.paymentMethod,
      amountTendered: input.amountTendered?.toFixed(2) ?? null,
      changeAmount: changeAmount.toFixed(2),
      notes: input.notes ?? null,
      cashierId,
      completedAt: null,
    })
    .returning();

  await db.insert(orderItems).values(
    input.items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      productName: item.name,
      productPrice: item.price.toFixed(2),
      quantity: item.quantity,
      subtotal: (item.price * item.quantity).toFixed(2),
      notes: item.notes ?? null,
    }))
  );

  // Deduct inventory — batch ingredients fetch per product
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const allIngredients = await db
    .select()
    .from(productIngredients)
    .where(inArray(productIngredients.productId, productIds));

  const ingredientsByProduct = new Map<string, typeof allIngredients>();
  for (const ing of allIngredients) {
    if (!ingredientsByProduct.has(ing.productId)) ingredientsByProduct.set(ing.productId, []);
    ingredientsByProduct.get(ing.productId)!.push(ing);
  }

  for (const item of input.items) {
    const ingredients = ingredientsByProduct.get(item.productId) ?? [];
    for (const ing of ingredients) {
      const deduction = parseFloat(ing.quantityUsed) * item.quantity;
      await db
        .update(inventoryItems)
        .set({
          currentStock: sql`${inventoryItems.currentStock}::numeric - ${deduction}`,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, ing.inventoryItemId));

      await db.insert(inventoryLogs).values({
        inventoryItemId: ing.inventoryItemId,
        changeAmount: (-deduction).toFixed(2),
        reason: "SALE",
        referenceOrderId: order.id,
        createdBy: cashierId,
      });
    }
  }

  revalidatePath("/orders");
  revalidatePath("/kitchen");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");

  return { success: true, order, receiptToken: order.receiptToken };
}

// ─── Shared item-fetch helper ─────────────────────────────────────────────────

async function attachItems<T extends { id: string }>(rows: T[]) {
  if (rows.length === 0) return rows.map((r) => ({ ...r, items: [] }));

  const ids = rows.map((r) => r.id);
  const allItems = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, ids));

  const byOrder = new Map<string, typeof allItems>();
  for (const item of allItems) {
    if (!byOrder.has(item.orderId)) byOrder.set(item.orderId, []);
    byOrder.get(item.orderId)!.push(item);
  }

  return rows.map((r) => ({ ...r, items: byOrder.get(r.id) ?? [] }));
}

// ─── getOrders: 2 queries total, no N+1 ──────────────────────────────────────

export async function getOrders(limit = 100, offset = 0) {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      type: orders.type,
      tableNumber: orders.tableNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      subtotal: orders.subtotal,
      discountAmount: orders.discountAmount,
      taxAmount: orders.taxAmount,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      receiptToken: orders.receiptToken,
      createdAt: orders.createdAt,
      completedAt: orders.completedAt,
      notes: orders.notes,
      cashierId: orders.cashierId,
      // Flat cashier name — single JOIN, no nested relation query
      cashierName: users.name,
    })
    .from(orders)
    .leftJoin(users, eq(orders.cashierId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  const withItems = await attachItems(rows);

  // Shape cashier to match the { name } object the client expects
  return withItems.map(({ cashierName, ...rest }) => ({
    ...rest,
    cashier: cashierName ? { name: cashierName } : null,
  }));
}

// ─── getKitchenOrders: only active orders, 2 queries ─────────────────────────

export async function getKitchenOrders() {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      type: orders.type,
      tableNumber: orders.tableNumber,
      customerName: orders.customerName,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(notInArray(orders.status, ["COMPLETED", "CANCELLED"]))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return attachItems(rows);
}

// ─── Other queries ────────────────────────────────────────────────────────────

export async function getOrderByToken(token: string) {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.receiptToken, token))
    .limit(1);

  if (!row) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, row.id));

  return { ...row, items };
}

export async function updateOrderStatus(id: string, status: string) {
  const [order] = await db
    .update(orders)
    .set({
      status: status as "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED",
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    })
    .where(eq(orders.id, id))
    .returning();
  revalidatePath("/orders");
  revalidatePath("/kitchen");
  return { success: true, data: order };
}

// ─── Dashboard range helpers ──────────────────────────────────────────────────

export type DashboardRange = "today" | "7d" | "30d" | "month" | "year" | "all" | "custom";

export interface DashboardStatsOptions {
  range: DashboardRange;
  from?: string;
  to?: string;
}

function buildDateFilter(opts: DashboardStatsOptions) {
  const { range, from, to } = opts;
  if (range === "all") return null;

  if (range === "custom" && from) {
    const [fy, fm] = from.split("-").map(Number);
    const start = new Date(fy, fm - 1, 1);
    const end = to
      ? (() => { const [ty, tm] = to.split("-").map(Number); return new Date(ty, tm, 0, 23, 59, 59, 999); })()
      : new Date();
    return { start, end };
  }

  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return { start: d, end: now };
    }
    case "7d": {
      const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return { start: d, end: now };
    }
    case "month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
    case "30d":
    default: {
      const d = new Date(now); d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return { start: d, end: now };
    }
  }
}

// ─── getDashboardStats ────────────────────────────────────────────────────────

export async function getDashboardStats(opts: DashboardStatsOptions = { range: "today" }) {
  const dateFilter = buildDateFilter(opts);
  const isToday = opts.range === "today";

  const completedInRange = dateFilter
    ? and(eq(orders.status, "COMPLETED"), gte(orders.createdAt, dateFilter.start), sql`${orders.createdAt} <= ${dateFilter.end}`)
    : eq(orders.status, "COMPLETED");

  const activeInRange = dateFilter
    ? and(ne(orders.status, "CANCELLED"), gte(orders.createdAt, dateFilter.start), sql`${orders.createdAt} <= ${dateFilter.end}`)
    : ne(orders.status, "CANCELLED");

  const [summary] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
      grossSales: sql<number>`COALESCE(SUM(${orders.subtotal}::numeric), 0)`,
      orderCount: count(orders.id),
      totalDiscounts: sql<number>`COALESCE(SUM(${orders.discountAmount}::numeric), 0)`,
      ordersWithDiscount: sql<number>`COUNT(*) FILTER (WHERE ${orders.discountAmount}::numeric > 0)`,
      totalTax: sql<number>`COALESCE(SUM(${orders.taxAmount}::numeric), 0)`,
    })
    .from(orders)
    .where(completedInRange);

  const avgOrderValue =
    Number(summary.orderCount) > 0 ? Number(summary.revenue) / Number(summary.orderCount) : 0;

  let isWideRange = false;
  if (opts.range === "all") {
    isWideRange = true;
  } else if (dateFilter) {
    isWideRange = (dateFilter.end.getTime() - dateFilter.start.getTime()) / 86_400_000 > 90;
  }

  const periodExpr = isToday
    ? sql`DATE_TRUNC('hour', ${orders.createdAt})`
    : isWideRange
      ? sql`DATE_TRUNC('month', ${orders.createdAt})`
      : sql`DATE(${orders.createdAt})`;

  const rawPeriods = await db
    .select({
      period: periodExpr.as("period"),
      revenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
      orderCount: count(orders.id),
    })
    .from(orders)
    .where(completedInRange)
    .groupBy(periodExpr)
    .orderBy(periodExpr);

  const topItems = await db
    .select({
      name: orderItems.productName,
      count: sql<number>`SUM(${orderItems.quantity})`,
      revenue: sql<number>`SUM(${orderItems.subtotal}::numeric)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(completedInRange)
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`SUM(${orderItems.subtotal}::numeric)`))
    .limit(8);

  const categoryRevenue = await db
    .select({
      name: categories.name,
      revenue: sql<number>`COALESCE(SUM(${orderItems.subtotal}::numeric), 0)`,
      count: sql<number>`SUM(${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(completedInRange)
    .groupBy(categories.name)
    .orderBy(desc(sql`SUM(${orderItems.subtotal}::numeric)`))
    .limit(8);

  const paymentBreakdown = await db
    .select({
      method: orders.paymentMethod,
      count: count(orders.id),
      revenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(activeInRange)
    .groupBy(orders.paymentMethod);

  return {
    revenue: Number(summary.revenue),
    grossSales: Number(summary.grossSales),
    orderCount: Number(summary.orderCount),
    avgOrderValue,
    totalDiscounts: Number(summary.totalDiscounts),
    ordersWithDiscount: Number(summary.ordersWithDiscount),
    totalTax: Number(summary.totalTax),
    revenueByPeriod: rawPeriods.map((r) => ({
      period: String(r.period),
      revenue: Number(r.revenue),
      orderCount: Number(r.orderCount),
    })),
    isHourly: isToday,
    isMonthly: isWideRange,
    topItems: topItems.map((i) => ({ name: i.name, count: Number(i.count), revenue: Number(i.revenue) })),
    categoryRevenue: categoryRevenue.map((c) => ({ name: c.name, revenue: Number(c.revenue), count: Number(c.count) })),
    paymentBreakdown: paymentBreakdown.map((p) => ({ method: p.method ?? "OTHER", count: Number(p.count), revenue: Number(p.revenue) })),
  };
}