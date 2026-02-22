"use server";

import { db } from "@/src/db";
import { storeSettings } from "@/src/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

const settingsSchema = z.object({
  storeName: z.string().min(1),
  storeAddress: z.string().optional().nullable(),
  storePhone: z.string().optional().nullable(),
  storeEmail: z.string().email().optional().nullable().or(z.literal("")),
  currency: z.string().default("PHP"),
  currencySymbol: z.string().default("₱"),
  taxRate: z.string().default("0"),
  taxEnabled: z.boolean().default(false),
  receiptFooter: z.string().optional().nullable(),
  receiptHeader: z.string().optional().nullable(),
});

export async function getStoreSettings() {
  const [settings] = await db.select().from(storeSettings).limit(1);
  if (!settings) {
    const [created] = await db.insert(storeSettings).values({}).returning();
    return created;
  }
  return settings;
}

export async function updateStoreSettings(
  data: z.infer<typeof settingsSchema>
) {
  const parsed = settingsSchema.parse(data);
  const existing = await getStoreSettings();

  const [updated] = await db
    .update(storeSettings)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(storeSettings.id, existing.id))
    .returning();

  revalidatePath("/settings");
  return { success: true, data: updated ?? existing };
}