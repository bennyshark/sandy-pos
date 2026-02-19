/**
 * Sandy POS — Database Seed
 * Run with: npm run db:seed
 */
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { db } from "."
import { categories, products, storeSettings } from "./schema"

async function seed() {
  console.log("🌱 Seeding Sandy POS database...")

  // Store Settings
  await db
    .insert(storeSettings)
    .values({
      storeName: "Sandy Café",
      storeAddress: "123 Beachside Road, Manila",
      storePhone: "+63 912 345 6789",
      currency: "PHP",
      currencySymbol: "₱",
      taxRate: "12",
      taxEnabled: false,
      receiptFooter: "Thank you for dining with us! Come back soon ☕",
      receiptHeader: "WiFi: SandyCafe | PW: beachvibes2024",
    })
    .onConflictDoNothing()

  console.log("  ✓ Store settings")

  // Categories
  const insertedCats = await db
    .insert(categories)
    .values([
      { name: "Hot Coffee",  emoji: "☕", color: "#c2903a", sortOrder: 1 },
      { name: "Cold Drinks", emoji: "🧊", color: "#58a4c2", sortOrder: 2 },
      { name: "Food",        emoji: "🍽️", color: "#6da833", sortOrder: 3 },
      { name: "Pastries",    emoji: "🥐", color: "#d47a34", sortOrder: 4 },
      { name: "Specials",    emoji: "⭐", color: "#9b59b6", sortOrder: 5 },
    ])
    .onConflictDoNothing()
    .returning()

  console.log(`  ✓ ${insertedCats.length} categories`)

  const [coffee, cold, food, pastry, specials] = insertedCats

  // Products
  const productData = []

  if (coffee) {
    productData.push(
      { name: "Americano",         price: "95",  categoryId: coffee.id,   description: "Bold espresso with hot water",                   sortOrder: 1 },
      { name: "Latte",             price: "120", categoryId: coffee.id,   description: "Espresso with silky steamed milk",               sortOrder: 2 },
      { name: "Cappuccino",        price: "115", categoryId: coffee.id,   description: "Espresso, steamed milk, and thick foam",         sortOrder: 3 },
      { name: "Caramel Macchiato", price: "135", categoryId: coffee.id,   description: "Vanilla, milk, espresso, caramel drizzle",       sortOrder: 4 },
      { name: "Flat White",        price: "125", categoryId: coffee.id,   description: "Ristretto with velvety microfoam",               sortOrder: 5 },
      { name: "Mocha",             price: "130", categoryId: coffee.id,   description: "Espresso, chocolate, steamed milk",              sortOrder: 6 }
    )
  }

  if (cold) {
    productData.push(
      { name: "Iced Americano",    price: "100", categoryId: cold.id,     description: "Espresso over ice",                             sortOrder: 1 },
      { name: "Iced Latte",        price: "130", categoryId: cold.id,     description: "Espresso, milk, ice",                           sortOrder: 2 },
      { name: "Iced Matcha Latte", price: "145", categoryId: cold.id,     description: "Premium matcha, oat milk, ice",                 sortOrder: 3 },
      { name: "Strawberry Lemonade", price: "110", categoryId: cold.id,   description: "Fresh strawberries, lemon, sparkling water",    sortOrder: 4 },
      { name: "Mango Shake",       price: "120", categoryId: cold.id,     description: "Fresh Philippine mangoes blended",              sortOrder: 5 },
      { name: "Brown Sugar Milk Tea", price: "135", categoryId: cold.id,  description: "Taiwanese brown sugar, milk, tapioca",          sortOrder: 6 }
    )
  }

  if (food) {
    productData.push(
      { name: "Club Sandwich",     price: "180", categoryId: food.id,     description: "Triple decker with turkey, bacon, egg",         sortOrder: 1 },
      { name: "Avocado Toast",     price: "165", categoryId: food.id,     description: "Sourdough, smashed avocado, chili flakes",      sortOrder: 2 },
      { name: "Pasta Carbonara",   price: "195", categoryId: food.id,     description: "Spaghetti, guanciale, egg, pecorino",           sortOrder: 3 },
      { name: "Caesar Salad",      price: "175", categoryId: food.id,     description: "Romaine, croutons, parmesan, anchovy dressing", sortOrder: 4 },
      { name: "Mushroom Risotto",  price: "210", categoryId: food.id,     description: "Arborio rice, wild mushrooms, parmesan",        sortOrder: 5 }
    )
  }

  if (pastry) {
    productData.push(
      { name: "Butter Croissant",  price: "75",  categoryId: pastry.id,   description: "Freshly baked, flaky & buttery",               sortOrder: 1 },
      { name: "Blueberry Muffin",  price: "85",  categoryId: pastry.id,   description: "Packed with fresh blueberries",                sortOrder: 2 },
      { name: "Chocolate Brownie", price: "90",  categoryId: pastry.id,   description: "Dense, fudgy, dark chocolate",                 sortOrder: 3 },
      { name: "Cheesecake Slice",  price: "130", categoryId: pastry.id,   description: "New York style, graham cracker crust",         sortOrder: 4 },
      { name: "Banana Bread",      price: "80",  categoryId: pastry.id,   description: "Moist, with walnuts and honey glaze",          sortOrder: 5 }
    )
  }

  if (specials) {
    productData.push(
      { name: "Sandy Special",     price: "165", categoryId: specials.id, description: "Secret recipe — ask your barista!",            sortOrder: 1 },
      { name: "Chef's Pasta",      price: "225", categoryId: specials.id, description: "Market-fresh ingredients, changes daily",      sortOrder: 2 }
    )
  }

  const insertedProducts = await db
    .insert(products)
    .values(productData)
    .onConflictDoNothing()
    .returning()

  console.log(`  ✓ ${insertedProducts.length} products`)
  console.log("\n✅ Seeding complete! Run: npm run dev")
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})