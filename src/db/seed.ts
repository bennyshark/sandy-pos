/**
 * Sandy POS — Database Seed
 * Run with: npm run db:seed
 * Safe to run multiple times — inserts only missing items by name.
 */
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { db } from "."
import { categories, products, storeSettings } from "./schema"
import { count, eq } from "drizzle-orm"

async function seed() {
  console.log("🌱 Seeding Sandy POS database...")

  // ─── Store Settings ──────────────────────────────────────────────────────────
  const [{ value: settingsCount }] = await db.select({ value: count() }).from(storeSettings)

  if (settingsCount === 0) {
    await db.insert(storeSettings).values({
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
    console.log("  ✓ Store settings inserted")
  } else {
    console.log("  ⏭  Store settings already exist, skipping")
  }

  // ─── Categories — insert only missing ones by name ───────────────────────────
  const existingCats = await db.select().from(categories)
  const existingCatNames = new Set(existingCats.map((c) => c.name))

  const categorySeeds = [
    { name: "Hot Coffee",     emoji: "☕", color: "#c2903a", sortOrder: 1  },
    { name: "Cold Drinks",    emoji: "🧊", color: "#58a4c2", sortOrder: 2  },
    { name: "Non-Coffee",     emoji: "🍵", color: "#7aab5e", sortOrder: 3  },
    { name: "Milk Tea",       emoji: "🧋", color: "#b07dc9", sortOrder: 4  },
    { name: "Smoothies",      emoji: "🥤", color: "#e05c8a", sortOrder: 5  },
    { name: "Food",           emoji: "🍽️", color: "#6da833", sortOrder: 6  },
    { name: "Breakfast",      emoji: "🍳", color: "#e8a020", sortOrder: 7  },
    { name: "Pasta & Rice",   emoji: "🍝", color: "#d4522a", sortOrder: 8  },
    { name: "Sandwiches",     emoji: "🥪", color: "#8db548", sortOrder: 9  },
    { name: "Pastries",       emoji: "🥐", color: "#d47a34", sortOrder: 10 },
    { name: "Cakes & Slices", emoji: "🎂", color: "#e0607e", sortOrder: 11 },
    { name: "Specials",       emoji: "⭐", color: "#9b59b6", sortOrder: 12 },
  ]

  const newCats = categorySeeds.filter((c) => !existingCatNames.has(c.name))

  let insertedNewCats: typeof categories.$inferSelect[] = []
  if (newCats.length > 0) {
    insertedNewCats = await db.insert(categories).values(newCats).returning()
    console.log(`  ✓ ${insertedNewCats.length} new categories inserted`)
  } else {
    console.log("  ⏭  All categories already exist, skipping")
  }

  // Full list of all cats (existing + newly inserted) for product linking
  const allCats = [...existingCats, ...insertedNewCats]
  const findCat = (name: string) => allCats.find((c) => c.name === name)

  // ─── Products — insert only missing ones by name ──────────────────────────────
  const existingProds = await db.select({ name: products.name }).from(products)
  const existingProdNames = new Set(existingProds.map((p) => p.name))

  const coffee    = findCat("Hot Coffee")
  const cold      = findCat("Cold Drinks")
  const noncoffee = findCat("Non-Coffee")
  const milktea   = findCat("Milk Tea")
  const smoothies = findCat("Smoothies")
  const food      = findCat("Food")
  const breakfast = findCat("Breakfast")
  const pasta     = findCat("Pasta & Rice")
  const sandwich  = findCat("Sandwiches")
  const pastry    = findCat("Pastries")
  const cakes     = findCat("Cakes & Slices")
  const specials  = findCat("Specials")

  const allProductSeeds = [
    // ── Hot Coffee ──
    ...(coffee ? [
      { name: "Americano",           price: "95",  categoryId: coffee.id, description: "Bold espresso with hot water",                    sortOrder: 1  },
      { name: "Latte",               price: "120", categoryId: coffee.id, description: "Espresso with silky steamed milk",                sortOrder: 2  },
      { name: "Cappuccino",          price: "115", categoryId: coffee.id, description: "Espresso, steamed milk, and thick foam",          sortOrder: 3  },
      { name: "Caramel Macchiato",   price: "135", categoryId: coffee.id, description: "Vanilla, milk, espresso, caramel drizzle",        sortOrder: 4  },
      { name: "Flat White",          price: "125", categoryId: coffee.id, description: "Ristretto with velvety microfoam",                sortOrder: 5  },
      { name: "Mocha",               price: "130", categoryId: coffee.id, description: "Espresso, chocolate, steamed milk",               sortOrder: 6  },
      { name: "Cortado",             price: "110", categoryId: coffee.id, description: "Equal parts espresso and warm milk",              sortOrder: 7  },
      { name: "Espresso",            price: "80",  categoryId: coffee.id, description: "Single or double shot, pure and strong",          sortOrder: 8  },
      { name: "Doppio",              price: "90",  categoryId: coffee.id, description: "Double espresso shot",                            sortOrder: 9  },
      { name: "Dirty Chai Latte",    price: "145", categoryId: coffee.id, description: "Chai tea latte spiked with a shot of espresso",   sortOrder: 10 },
      { name: "Hazelnut Latte",      price: "135", categoryId: coffee.id, description: "Espresso, hazelnut syrup, steamed milk",          sortOrder: 11 },
      { name: "Spanish Latte",       price: "140", categoryId: coffee.id, description: "Espresso, condensed milk, steamed milk",          sortOrder: 12 },
    ] : []),

    // ── Cold Drinks ──
    ...(cold ? [
      { name: "Iced Americano",        price: "100", categoryId: cold.id, description: "Espresso over ice",                               sortOrder: 1  },
      { name: "Iced Latte",            price: "130", categoryId: cold.id, description: "Espresso, milk, ice",                             sortOrder: 2  },
      { name: "Iced Caramel Latte",    price: "145", categoryId: cold.id, description: "Espresso, caramel, milk, ice",                    sortOrder: 3  },
      { name: "Iced Spanish Latte",    price: "145", categoryId: cold.id, description: "Espresso, condensed milk, ice",                   sortOrder: 4  },
      { name: "Cold Brew",             price: "140", categoryId: cold.id, description: "12-hour steeped, smooth and low-acid",            sortOrder: 5  },
      { name: "Nitro Cold Brew",       price: "160", categoryId: cold.id, description: "Cold brew infused with nitrogen",                 sortOrder: 6  },
      { name: "Strawberry Lemonade",   price: "110", categoryId: cold.id, description: "Fresh strawberries, lemon, sparkling water",      sortOrder: 7  },
      { name: "Mango Shake",           price: "120", categoryId: cold.id, description: "Fresh Philippine mangoes blended",                sortOrder: 8  },
      { name: "Calamansi Soda",        price: "95",  categoryId: cold.id, description: "Fresh calamansi, sparkling water, sugar",         sortOrder: 9  },
      { name: "Sparkling Water",       price: "65",  categoryId: cold.id, description: "Chilled sparkling mineral water",                 sortOrder: 10 },
      { name: "Still Water",           price: "45",  categoryId: cold.id, description: "Chilled still water",                             sortOrder: 11 },
    ] : []),

    // ── Non-Coffee ──
    ...(noncoffee ? [
      { name: "Hot Chocolate",         price: "115", categoryId: noncoffee.id, description: "Rich Belgian cocoa with steamed milk",        sortOrder: 1 },
      { name: "Matcha Latte",          price: "135", categoryId: noncoffee.id, description: "Ceremonial grade matcha, steamed oat milk",   sortOrder: 2 },
      { name: "Turmeric Latte",        price: "125", categoryId: noncoffee.id, description: "Golden milk with turmeric and ginger",        sortOrder: 3 },
      { name: "Chamomile Tea",         price: "90",  categoryId: noncoffee.id, description: "Soothing dried chamomile flowers",            sortOrder: 4 },
      { name: "English Breakfast Tea", price: "85",  categoryId: noncoffee.id, description: "Bold black tea, served with milk",            sortOrder: 5 },
      { name: "Earl Grey Latte",       price: "120", categoryId: noncoffee.id, description: "Earl grey tea, bergamot, steamed milk",       sortOrder: 6 },
      { name: "Peppermint Tea",        price: "90",  categoryId: noncoffee.id, description: "Fresh and cooling peppermint leaves",         sortOrder: 7 },
      { name: "Iced Matcha Latte",     price: "145", categoryId: noncoffee.id, description: "Premium matcha, oat milk, ice",               sortOrder: 8 },
    ] : []),

    // ── Milk Tea ──
    ...(milktea ? [
      { name: "Brown Sugar Milk Tea",  price: "135", categoryId: milktea.id, description: "Taiwanese brown sugar, milk, tapioca pearls",   sortOrder: 1 },
      { name: "Classic Milk Tea",      price: "115", categoryId: milktea.id, description: "Black tea, creamer, tapioca pearls",             sortOrder: 2 },
      { name: "Taro Milk Tea",         price: "130", categoryId: milktea.id, description: "Taro root, milk, chewy pearls",                  sortOrder: 3 },
      { name: "Matcha Milk Tea",       price: "135", categoryId: milktea.id, description: "Green tea, milk, tapioca pearls",                sortOrder: 4 },
      { name: "Wintermelon Milk Tea",  price: "120", categoryId: milktea.id, description: "Wintermelon syrup, milk, tapioca",               sortOrder: 5 },
      { name: "Strawberry Milk Tea",   price: "130", categoryId: milktea.id, description: "Strawberry tea, milk, lychee jelly",             sortOrder: 6 },
      { name: "Tiger Milk Tea",        price: "140", categoryId: milktea.id, description: "Brown sugar stripes, fresh milk, pearls",        sortOrder: 7 },
      { name: "Hokkaido Milk Tea",     price: "135", categoryId: milktea.id, description: "Japanese style, rich Hokkaido milk",             sortOrder: 8 },
    ] : []),

    // ── Smoothies ──
    ...(smoothies ? [
      { name: "Mango Smoothie",        price: "130", categoryId: smoothies.id, description: "Frozen Philippine mango, yogurt, honey",      sortOrder: 1 },
      { name: "Strawberry Smoothie",   price: "130", categoryId: smoothies.id, description: "Strawberries, banana, oat milk",              sortOrder: 2 },
      { name: "Green Detox",           price: "145", categoryId: smoothies.id, description: "Spinach, cucumber, apple, ginger, lemon",     sortOrder: 3 },
      { name: "Acai Bowl",             price: "165", categoryId: smoothies.id, description: "Acai blend, granola, fresh fruit, honey",     sortOrder: 4 },
      { name: "Banana Peanut Butter",  price: "135", categoryId: smoothies.id, description: "Banana, peanut butter, milk, honey",          sortOrder: 5 },
      { name: "Berry Blast",           price: "140", categoryId: smoothies.id, description: "Blueberry, raspberry, strawberry, yogurt",    sortOrder: 6 },
    ] : []),

    // ── Food ──
    ...(food ? [
      { name: "Caesar Salad",          price: "175", categoryId: food.id, description: "Romaine, croutons, parmesan, anchovy dressing",    sortOrder: 1 },
      { name: "Greek Salad",           price: "165", categoryId: food.id, description: "Cucumber, tomato, olives, feta, oregano",          sortOrder: 2 },
      { name: "Chicken Wings",         price: "195", categoryId: food.id, description: "Crispy wings, choice of buffalo or garlic",        sortOrder: 3 },
      { name: "Loaded Fries",          price: "155", categoryId: food.id, description: "Crispy fries, cheese sauce, bacon bits, chives",   sortOrder: 4 },
      { name: "Garlic Bread",          price: "85",  categoryId: food.id, description: "Toasted baguette, herb butter, garlic",            sortOrder: 5 },
      { name: "Soup of the Day",       price: "120", categoryId: food.id, description: "Ask your server for today's selection",            sortOrder: 6 },
      { name: "Bruschetta",            price: "145", categoryId: food.id, description: "Tomato, basil, garlic, olive oil on ciabatta",     sortOrder: 7 },
    ] : []),

    // ── Breakfast ──
    ...(breakfast ? [
      { name: "Full Breakfast Plate",  price: "225", categoryId: breakfast.id, description: "Eggs, bacon, sausage, toast, hash brown",     sortOrder: 1 },
      { name: "Avocado Toast",         price: "165", categoryId: breakfast.id, description: "Sourdough, smashed avocado, chili flakes",    sortOrder: 2 },
      { name: "Eggs Benedict",         price: "195", categoryId: breakfast.id, description: "Poached eggs, ham, hollandaise on muffin",    sortOrder: 3 },
      { name: "French Toast",          price: "155", categoryId: breakfast.id, description: "Brioche, maple syrup, powdered sugar, berries", sortOrder: 4 },
      { name: "Overnight Oats",        price: "135", categoryId: breakfast.id, description: "Oats, chia seeds, almond milk, fruit compote", sortOrder: 5 },
      { name: "Breakfast Burrito",     price: "175", categoryId: breakfast.id, description: "Scrambled eggs, chorizo, cheese, salsa",      sortOrder: 6 },
      { name: "Granola Bowl",          price: "145", categoryId: breakfast.id, description: "House granola, Greek yogurt, honey, berries", sortOrder: 7 },
      { name: "Pancake Stack",         price: "165", categoryId: breakfast.id, description: "3 fluffy pancakes, maple syrup, butter",      sortOrder: 8 },
    ] : []),

    // ── Pasta & Rice ──
    ...(pasta ? [
      { name: "Pasta Carbonara",       price: "195", categoryId: pasta.id, description: "Spaghetti, guanciale, egg yolk, pecorino",        sortOrder: 1 },
      { name: "Pasta Aglio e Olio",    price: "175", categoryId: pasta.id, description: "Spaghetti, garlic, olive oil, chili, parsley",    sortOrder: 2 },
      { name: "Pasta Arrabbiata",      price: "180", categoryId: pasta.id, description: "Penne, spicy tomato sauce, fresh basil",          sortOrder: 3 },
      { name: "Mushroom Risotto",      price: "210", categoryId: pasta.id, description: "Arborio rice, wild mushrooms, white wine, parmesan", sortOrder: 4 },
      { name: "Seafood Pasta",         price: "225", categoryId: pasta.id, description: "Linguine, shrimp, squid, clams, white wine",      sortOrder: 5 },
      { name: "Pesto Pasta",           price: "185", categoryId: pasta.id, description: "Fettuccine, basil pesto, cherry tomatoes, pine nuts", sortOrder: 6 },
      { name: "Lasagna",               price: "215", categoryId: pasta.id, description: "Layers of beef bolognese, bechamel, mozzarella",  sortOrder: 7 },
      { name: "Chicken Pesto Rice",    price: "195", categoryId: pasta.id, description: "Grilled chicken, steamed rice, house pesto",      sortOrder: 8 },
    ] : []),

    // ── Sandwiches ──
    ...(sandwich ? [
      { name: "Club Sandwich",         price: "180", categoryId: sandwich.id, description: "Triple decker: turkey, bacon, egg, lettuce",   sortOrder: 1 },
      { name: "BLT",                   price: "155", categoryId: sandwich.id, description: "Bacon, lettuce, tomato, mayo on toasted bread", sortOrder: 2 },
      { name: "Grilled Chicken",       price: "175", categoryId: sandwich.id, description: "Grilled chicken, pesto, mozzarella, ciabatta", sortOrder: 3 },
      { name: "Tuna Melt",             price: "160", categoryId: sandwich.id, description: "Chunky tuna, cheddar, pickles, toasted brioche", sortOrder: 4 },
      { name: "Caprese Panini",        price: "165", categoryId: sandwich.id, description: "Fresh mozzarella, tomato, basil, balsamic",    sortOrder: 5 },
      { name: "Egg Salad Sandwich",    price: "140", categoryId: sandwich.id, description: "Creamy egg salad, dill, on soft white bread",  sortOrder: 6 },
      { name: "Pulled Pork Sandwich",  price: "195", categoryId: sandwich.id, description: "Slow-cooked pork, coleslaw, BBQ sauce, brioche", sortOrder: 7 },
    ] : []),

    // ── Pastries ──
    ...(pastry ? [
      { name: "Butter Croissant",      price: "75",  categoryId: pastry.id, description: "Freshly baked, flaky & buttery",                 sortOrder: 1  },
      { name: "Almond Croissant",      price: "95",  categoryId: pastry.id, description: "Croissant filled with almond frangipane",         sortOrder: 2  },
      { name: "Pain au Chocolat",      price: "90",  categoryId: pastry.id, description: "Flaky pastry wrapped around dark chocolate",      sortOrder: 3  },
      { name: "Blueberry Muffin",      price: "85",  categoryId: pastry.id, description: "Packed with fresh blueberries",                   sortOrder: 4  },
      { name: "Double Choco Muffin",   price: "90",  categoryId: pastry.id, description: "Chocolate batter, melty chocolate chips",         sortOrder: 5  },
      { name: "Cinnamon Roll",         price: "100", categoryId: pastry.id, description: "Soft dough, cinnamon sugar, cream cheese glaze",  sortOrder: 6  },
      { name: "Banana Bread",          price: "80",  categoryId: pastry.id, description: "Moist, with walnuts and honey glaze",             sortOrder: 7  },
      { name: "Chocolate Brownie",     price: "90",  categoryId: pastry.id, description: "Dense, fudgy, dark chocolate",                    sortOrder: 8  },
      { name: "Lemon Danish",          price: "95",  categoryId: pastry.id, description: "Puff pastry, lemon curd, powdered sugar",         sortOrder: 9  },
      { name: "Scone",                 price: "80",  categoryId: pastry.id, description: "Classic British scone with clotted cream & jam",  sortOrder: 10 },
    ] : []),

    // ── Cakes & Slices ──
    ...(cakes ? [
      { name: "Cheesecake Slice",      price: "130", categoryId: cakes.id, description: "New York style, graham cracker crust",             sortOrder: 1 },
      { name: "Chocolate Lava Cake",   price: "155", categoryId: cakes.id, description: "Warm molten center, served with vanilla ice cream", sortOrder: 2 },
      { name: "Tiramisu",              price: "145", categoryId: cakes.id, description: "Espresso-soaked ladyfingers, mascarpone cream",     sortOrder: 3 },
      { name: "Carrot Cake Slice",     price: "125", categoryId: cakes.id, description: "Spiced carrot cake with cream cheese frosting",    sortOrder: 4 },
      { name: "Red Velvet Slice",      price: "130", categoryId: cakes.id, description: "Red velvet sponge, white chocolate frosting",      sortOrder: 5 },
      { name: "Matcha Cake Slice",     price: "135", categoryId: cakes.id, description: "Layered matcha sponge with white chocolate cream", sortOrder: 6 },
      { name: "Mango Bravo",           price: "150", categoryId: cakes.id, description: "Mango cream, bravo crunch, graham layers",         sortOrder: 7 },
      { name: "Leche Flan",            price: "110", categoryId: cakes.id, description: "Classic Filipino caramel custard",                 sortOrder: 8 },
    ] : []),

    // ── Specials ──
    ...(specials ? [
      { name: "Sandy Special",         price: "165", categoryId: specials.id, description: "Secret recipe — ask your barista!",             sortOrder: 1 },
      { name: "Chef's Pasta",          price: "225", categoryId: specials.id, description: "Market-fresh ingredients, changes daily",       sortOrder: 2 },
      { name: "Seasonal Drink",        price: "155", categoryId: specials.id, description: "Ask us what's in season today",                sortOrder: 3 },
      { name: "Weekend Brunch Set",    price: "295", categoryId: specials.id, description: "Main + drink + dessert, available Sat-Sun",    sortOrder: 4 },
      { name: "Sandy Bundle",          price: "250", categoryId: specials.id, description: "Any sandwich + any cold drink + cookie",       sortOrder: 5 },
    ] : []),
  ]

  const newProducts = allProductSeeds.filter((p) => !existingProdNames.has(p.name))

  if (newProducts.length > 0) {
    const insertedProducts = await db.insert(products).values(newProducts).returning()
    console.log(`  ✓ ${insertedProducts.length} new products inserted`)
  } else {
    console.log("  ⏭  All products already exist, skipping")
  }

  console.log("\n✅ Seeding complete! Run: npm run dev")
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})