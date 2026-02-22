"use server";

import { db } from "@/src/db";
import {
  orders,
  orderItems,
  inventoryItems,
  productIngredients,
  inventoryLogs,
  storeSettings,
} from "@/src/db/schema";
import { eq, desc, and, gte, sql, count } from "drizzle-orm";
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

  // Get settings for tax rate
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
      // Orders start as PENDING — kitchen will move them through the workflow
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
      // completedAt is null until kitchen marks it complete
      completedAt: null,
    })
    .returning();

  // Insert order items
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

  // Auto-deduct inventory for products with recipes
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

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Today totals
  const [todayStats] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
      orderCount: count(orders.id),
    })
    .from(orders)
    .where(and(eq(orders.status, "COMPLETED"), gte(orders.createdAt, today)));

  // Revenue last 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const revenueByDay = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(
      and(eq(orders.status, "COMPLETED"), gte(orders.createdAt, sevenDaysAgo))
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  // Top items last 30 days
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const topItems = await db
    .select({
      name: orderItems.productName,
      count: sql<number>`SUM(${orderItems.quantity})`,
      revenue: sql<number>`SUM(${orderItems.subtotal}::numeric)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(eq(orders.status, "COMPLETED"), gte(orders.createdAt, thirtyDaysAgo))
    )
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`SUM(${orderItems.quantity})`))
    .limit(8);

  // Order type breakdown
  const orderTypeBreakdown = await db
    .select({ type: orders.type, count: count(orders.id) })
    .from(orders)
    .where(and(eq(orders.status, "COMPLETED"), gte(orders.createdAt, today)))
    .groupBy(orders.type);

  // Recent orders
  const recentOrders = await db.query.orders.findMany({
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
    limit: 5,
  });

  const avgOrderValue =
    Number(todayStats.orderCount) > 0
      ? Number(todayStats.revenue) / Number(todayStats.orderCount)
      : 0;

  return {
    todayRevenue: Number(todayStats.revenue),
    todayOrders: Number(todayStats.orderCount),
    avgOrderValue,
    topItems: topItems.map((i) => ({
      name: i.name,
      count: Number(i.count),
      revenue: Number(i.revenue),
    })),
    revenueByDay: revenueByDay.map((r) => ({
      date: r.date,
      revenue: Number(r.revenue),
    })),
    orderTypeBreakdown: orderTypeBreakdown.map((o) => ({
      type: o.type,
      count: Number(o.count),
    })),
    recentOrders: recentOrders as never,
  };
}