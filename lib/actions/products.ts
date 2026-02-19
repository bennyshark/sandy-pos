"use server";

import { db } from "@/src/db";
import { categories, products } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name required"),
  color: z.string().default("#d4a958"),
  emoji: z.string().default("☕"),
  sortOrder: z.number().default(0),
});

const productSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional().nullable(),
  price: z.string().min(1, "Price required"),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
  trackInventory: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

// ── Categories ──────────────────────────────────────────

export async function getCategories() {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const parsed = categorySchema.parse(data);
  const [cat] = await db.insert(categories).values(parsed).returning();
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { success: true, data: cat };
}

export async function updateCategory(
  id: string,
  data: Partial<z.infer<typeof categorySchema>>
) {
  const [cat] = await db
    .update(categories)
    .set(data)
    .where(eq(categories.id, id))
    .returning();
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { success: true, data: cat };
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { success: true };
}

// ── Products ────────────────────────────────────────────

export async function getProducts() {
  return db.query.products.findMany({
    with: { category: true },
    orderBy: [asc(products.sortOrder), asc(products.name)],
  });
}

export async function getAvailableProducts() {
  return db.query.products.findMany({
    where: eq(products.isAvailable, true),
    with: { category: true },
    orderBy: [asc(products.sortOrder), asc(products.name)],
  });
}

export async function createProduct(data: z.infer<typeof productSchema>) {
  const parsed = productSchema.parse(data);
  const [product] = await db
    .insert(products)
    .values({
      ...parsed,
      categoryId: parsed.categoryId ?? null,
      imageUrl: parsed.imageUrl ?? null,
      description: parsed.description ?? null,
    })
    .returning();
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { success: true, data: product };
}

export async function updateProduct(
  id: string,
  data: Partial<z.infer<typeof productSchema>>
) {
  const [product] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { success: true, data: product };
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { success: true };
}

export async function toggleProductAvailability(
  id: string,
  isAvailable: boolean
) {
  const [product] = await db
    .update(products)
    .set({ isAvailable, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { success: true, data: product };
}
