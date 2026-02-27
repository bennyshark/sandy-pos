"use server";

import { cache } from "react";
import { db } from "@/src/db";
import { inventoryItems, inventoryLogs } from "@/src/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";

const inventoryItemSchema = z.object({
  name: z.string().min(1),
  unit: z.enum(["g", "kg", "ml", "l", "pcs", "oz", "lb", "cups"]),
  currentStock: z.string(),
  lowStockThreshold: z.string(),
  costPerUnit: z.string(),
});

// ─── Cached reads ─────────────────────────────────────────────────────────────

export const getInventoryItems = cache(async () => {
  return db.select().from(inventoryItems).orderBy(inventoryItems.name);
});

export const getLowStockItems = cache(async () => {
  return db
    .select()
    .from(inventoryItems)
    .where(
      sql`${inventoryItems.currentStock}::numeric <= ${inventoryItems.lowStockThreshold}::numeric`
    );
});

export const getInventoryLogs = cache(async (itemId?: string) => {
  if (itemId) {
    return db.query.inventoryLogs.findMany({
      where: eq(inventoryLogs.inventoryItemId, itemId),
      with: { item: true, createdByUser: true },
      orderBy: [desc(inventoryLogs.createdAt)],
      limit: 50,
    });
  }
  return db.query.inventoryLogs.findMany({
    with: { item: true, createdByUser: true },
    orderBy: [desc(inventoryLogs.createdAt)],
    limit: 100,
  });
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createInventoryItem(data: z.infer<typeof inventoryItemSchema>) {
  const parsed = inventoryItemSchema.parse(data);
  const session = await auth();

  const [item] = await db.insert(inventoryItems).values(parsed).returning();

  if (parseFloat(parsed.currentStock) > 0) {
    await db.insert(inventoryLogs).values({
      inventoryItemId: item.id,
      changeAmount: parsed.currentStock,
      reason: "INITIAL",
      createdBy: session?.user?.id ?? null,
    });
  }

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true, data: item };
}

export async function updateInventoryItem(id: string, data: Partial<z.infer<typeof inventoryItemSchema>>) {
  const [item] = await db
    .update(inventoryItems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(inventoryItems.id, id))
    .returning();
  revalidatePath("/inventory");
  return { success: true, data: item };
}

export async function deleteInventoryItem(id: string) {
  await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  revalidatePath("/inventory");
  return { success: true };
}

export async function restockItem(id: string, amount: number, notes?: string) {
  const session = await auth();

  await db
    .update(inventoryItems)
    .set({
      currentStock: sql`${inventoryItems.currentStock}::numeric + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, id));

  await db.insert(inventoryLogs).values({
    inventoryItemId: id,
    changeAmount: amount.toFixed(2),
    reason: "RESTOCK",
    notes: notes ?? null,
    createdBy: session?.user?.id ?? null,
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function adjustStock(id: string, newAmount: number, notes?: string) {
  const session = await auth();
  const [current] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, id));
  if (!current) return { success: false };

  const diff = newAmount - parseFloat(current.currentStock);

  await db
    .update(inventoryItems)
    .set({ currentStock: newAmount.toFixed(2), updatedAt: new Date() })
    .where(eq(inventoryItems.id, id));

  await db.insert(inventoryLogs).values({
    inventoryItemId: id,
    changeAmount: diff.toFixed(2),
    reason: "ADJUSTMENT",
    notes: notes ?? null,
    createdBy: session?.user?.id ?? null,
  });

  revalidatePath("/inventory");
  return { success: true };
}