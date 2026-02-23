"use server";

import { db } from "@/src/db";
import {
  orders,
  orderItems,
  inventoryItems,
  productIngredients,
  inventoryLogs,
  storeSettings,
  categories,
  products,
} from "@/src/db/schema";
import { eq, ne, desc, and, gte, sql, count } from "drizzle-orm";
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
  const taxRate = settings?.taxEnabled
    ? parseFloat(settings.taxRate ?? "0")
    : 0;

  const subtotal = input.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const discountAmount = input.discountAmount ?? 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;
  const changeAmount = input.amountTendered
    ? Math.max(0, input.amountTendered - total)
    : 0;

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

  for (const item of input.items) {
    const ingredients = await db
      .select()
      .from(productIngredients)
      .where(eq(productIngredients.productId, item.productId));

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

export async function getOrders(limit = 100, offset = 0) {
  return db.query.orders.findMany({
    with: { items: true, cashier: true },
    orderBy: [desc(orders.createdAt)],
    limit,
    offset,
  });
}

export async function getOrderByToken(token: string) {
  const result = await db.query.orders.findMany({
    where: eq(orders.receiptToken, token),
    with: { items: true },
    limit: 1,
  });
  return result[0] ?? null;
}

export async function updateOrderStatus(id: string, status: string) {
  const [order] = await db
    .update(orders)
    .set({
      status: status as
        | "PENDING"
        | "PREPARING"
        | "READY"
        | "COMPLETED"
        | "CANCELLED",
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    })
    .where(eq(orders.id, id))
    .returning();
  revalidatePath("/orders");
  revalidatePath("/kitchen");
  return { success: true, data: order };
}

// ─── Range helpers ────────────────────────────────────────────────────────────

export type DashboardRange = "today" | "7d" | "30d" | "month";

function getStartDate(range: DashboardRange): Date {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "month": {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case "30d":
    default: {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
}

// ─── Main stats query ─────────────────────────────────────────────────────────

export async function getDashboardStats(range: DashboardRange = "today") {
  const startDate = getStartDate(range);
  const isToday = range === "today";

  // Only COMPLETED orders count toward revenue/sales figures
  const completedInRange = and(
    eq(orders.status, "COMPLETED"),
    gte(orders.createdAt, startDate)
  );

  // Payment method counts all active orders (pending → completed), excludes cancelled
  const activeInRange = and(
    ne(orders.status, "CANCELLED"),
    gte(orders.createdAt, startDate)
  );

  // ── Summary totals ──────────────────────────────────────────────────────────
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
    Number(summary.orderCount) > 0
      ? Number(summary.revenue) / Number(summary.orderCount)
      : 0;

  // ── Revenue by period (hourly for today, daily otherwise) ───────────────────
  const periodExpr = isToday
    ? sql`DATE_TRUNC('hour', ${orders.createdAt})`
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

  const revenueByPeriod = rawPeriods.map((r) => ({
    period: String(r.period),
    revenue: Number(r.revenue),
    orderCount: Number(r.orderCount),
  }));

  // ── Top items by revenue ────────────────────────────────────────────────────
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

  // ── Revenue by category ─────────────────────────────────────────────────────
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

  // ── Payment method breakdown (all active: pending/preparing/ready/completed) ─
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
    revenueByPeriod,
    isHourly: isToday,
    topItems: topItems.map((i) => ({
      name: i.name,
      count: Number(i.count),
      revenue: Number(i.revenue),
    })),
    categoryRevenue: categoryRevenue.map((c) => ({
      name: c.name,
      revenue: Number(c.revenue),
      count: Number(c.count),
    })),
    paymentBreakdown: paymentBreakdown.map((p) => ({
      method: p.method ?? "OTHER",
      count: Number(p.count),
      revenue: Number(p.revenue),
    })),
  };
}