// ============================================================
// scripts/seedData.js  —  Run ONCE to seed Firestore
// Usage:  node scripts/seedData.js
// ============================================================
// Skips a collection automatically if it already has documents,
// so re-running is safe (won't duplicate).
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { createInterface } from "readline";

const firebaseConfig = {
  apiKey: "AIzaSyDCUx3OXM6vJn09kkAqeZl8FQ52enZOWI0",
  authDomain: "rpsportsarenabd.firebaseapp.com",
  projectId: "rpsportsarenabd",
  storageBucket: "rpsportsarenabd.firebasestorage.app",
  messagingSenderId: "925371536671",
  appId: "1:925371536671:web:e7d2e1076d0d84487bcc2a",
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

// ── Food Products ─────────────────────────────────────────────────────────────
// Prices in BDT (Tk). stock: null = not tracked.

const FOOD_PRODUCTS = [
  // ── Biriyani ──
  { name: "Chicken Bamboo Biriyani",  price: 180, category: "Biriyani",     isActive: true, stock: null },
  { name: "Mutton Bamboo Biriyani",   price: 250, category: "Biriyani",     isActive: true, stock: null },
  { name: "Handi Biriyani",           price: 250, category: "Biriyani",     isActive: true, stock: null },

  // ── Thali ──
  { name: "Arena Special Thali",      price: 400, category: "Thali",        isActive: true, stock: null },
  { name: "Kolkata Thali",            price: 350, category: "Thali",        isActive: true, stock: null },

  // ── Kids Platter ──
  { name: "Little Champs Platter",    price: 100, category: "Kids Platter", isActive: true, stock: null },
  { name: "Junior Feast",             price: 120, category: "Kids Platter", isActive: true, stock: null },
  { name: "Junior Feast Plus",        price: 150, category: "Kids Platter", isActive: true, stock: null },

  // ── Set Menu ──
  { name: "Student Platter",          price: 160, category: "Set Menu",     isActive: true, stock: null },
  { name: "Classic Combo",            price: 180, category: "Set Menu",     isActive: true, stock: null },
  { name: "Beef Combo",               price: 230, category: "Set Menu",     isActive: true, stock: null },
  { name: "Arena Meal",               price: 260, category: "Set Menu",     isActive: true, stock: null },
  { name: "The BBQ Express",          price: 300, category: "Set Menu",     isActive: true, stock: null },

  // ── Rice ──
  { name: "Egg Fried Rice",           price: 220, category: "Rice",         isActive: true, stock: null },
  { name: "Chicken Fried Rice",       price: 280, category: "Rice",         isActive: true, stock: null },
  { name: "Arena Special Fried Rice", price: 320, category: "Rice",         isActive: true, stock: null },

  // ── Soup ──
  { name: "Special Thai Soup",        price: 280, category: "Soup",         isActive: true, stock: null },
  { name: "Chicken Corn Soup",        price: 220, category: "Soup",         isActive: true, stock: null },
  { name: "Thai Soup",                price: 100, category: "Soup",         isActive: true, stock: null },
  { name: "Cream of Mushroom Soup",   price: 150, category: "Soup",         isActive: true, stock: null },

  // ── Curry ──
  { name: "Chicken Chilli Onion",     price: 200, category: "Curry",        isActive: true, stock: null },
  { name: "Chicken Masala",           price: 250, category: "Curry",        isActive: true, stock: null },
  { name: "Beef Chilli Onion",        price: 280, category: "Curry",        isActive: true, stock: null },
  { name: "Beef Masala",              price: 330, category: "Curry",        isActive: true, stock: null },

  // ── Appetizer ──
  { name: "Szechuan Chicken",         price: 320, category: "Appetizer",    isActive: true, stock: null },
  { name: "Fried Wonton",             price: 200, category: "Appetizer",    isActive: true, stock: null },
  { name: "Potato Wedges",            price:  80, category: "Appetizer",    isActive: true, stock: null },
  { name: "French Fries (Regular)",   price:  60, category: "Appetizer",    isActive: true, stock: null },
  { name: "French Fries (Large)",     price: 100, category: "Appetizer",    isActive: true, stock: null },
  { name: "Crispy Chicken Fry",       price: 100, category: "Appetizer",    isActive: true, stock: null },
  { name: "Chicken Lollipop (6pcs)",  price: 750, category: "Appetizer",    isActive: true, stock: null },

  // ── Salad ──
  { name: "Cashew Nut Salad",         price: 350, category: "Salad",        isActive: true, stock: null },
  { name: "Mixed Fruits Salad",       price: 380, category: "Salad",        isActive: true, stock: null },
  { name: "Arena Special Salad",      price: 420, category: "Salad",        isActive: true, stock: null },

  // ── Sizzling ──
  { name: "Chicken Sizzling",         price: 380, category: "Sizzling",     isActive: true, stock: null },
  { name: "Beef Sizzling",            price: 450, category: "Sizzling",     isActive: true, stock: null },

  // ── Pizza (3 sizes each) ──
  { name: 'Four Flavor Pizza (8")',       price: 370, category: "Pizza", isActive: true, stock: null },
  { name: 'Four Flavor Pizza (10")',      price: 470, category: "Pizza", isActive: true, stock: null },
  { name: 'Four Flavor Pizza (12")',      price: 570, category: "Pizza", isActive: true, stock: null },
  { name: 'Chicken Meatball Pizza (8")', price: 350, category: "Pizza", isActive: true, stock: null },
  { name: 'Chicken Meatball Pizza (10")',price: 450, category: "Pizza", isActive: true, stock: null },
  { name: 'Chicken Meatball Pizza (12")',price: 550, category: "Pizza", isActive: true, stock: null },
  { name: 'Special Pizza (8")',          price: 400, category: "Pizza", isActive: true, stock: null },
  { name: 'Special Pizza (10")',         price: 500, category: "Pizza", isActive: true, stock: null },
  { name: 'Special Pizza (12")',         price: 600, category: "Pizza", isActive: true, stock: null },

  // ── Burger ──
  { name: "Chicken Burger",           price: 160, category: "Burger",       isActive: true, stock: null },
  { name: "Beef Burger",              price: 200, category: "Burger",       isActive: true, stock: null },

  // ── Chicken Wings ──
  { name: "Chicken Naga Wings (6pcs)", price: 240, category: "Wings",       isActive: true, stock: null },
  { name: "Chicken BBQ Wings (6pcs)",  price: 240, category: "Wings",       isActive: true, stock: null },

  // ── Sub ──
  { name: "Chicken Sub",              price: 150, category: "Sub",          isActive: true, stock: null },
  { name: "Special Sub",              price: 199, category: "Sub",          isActive: true, stock: null },

  // ── Pasta ──
  { name: "Oven Baked White Pasta",   price: 150, category: "Pasta",        isActive: true, stock: null },
  { name: "Smoky BBQ Pasta",          price: 150, category: "Pasta",        isActive: true, stock: null },
  { name: "Special Pasta",            price: 250, category: "Pasta",        isActive: true, stock: null },

  // ── Meat Box ──
  { name: "Classic Meat Box",         price: 150, category: "Meat Box",     isActive: true, stock: null },
  { name: "Special Meat Box",         price: 200, category: "Meat Box",     isActive: true, stock: null },

  // ── Fresh Juice ──
  { name: "Lemon Juice",              price:  40, category: "Fresh Juice",  isActive: true, stock: null },
  { name: "Lemon Mint",               price:  50, category: "Fresh Juice",  isActive: true, stock: null },
  { name: "Mango Juice",              price:  50, category: "Fresh Juice",  isActive: true, stock: null },
  { name: "Water Melon Juice",        price:  50, category: "Fresh Juice",  isActive: true, stock: null },
  { name: "Pineapple Juice",          price:  60, category: "Fresh Juice",  isActive: true, stock: null },
  { name: "Blue Ocean",               price:  70, category: "Fresh Juice",  isActive: true, stock: null },
  { name: "Malta Juice",              price:  80, category: "Fresh Juice",  isActive: true, stock: null },
  { name: "Orange Juice",             price:  80, category: "Fresh Juice",  isActive: true, stock: null },

  // ── Lassi ──
  { name: "Sweet Lassi",              price:  50, category: "Lassi",        isActive: true, stock: null },
  { name: "Mint Lassi",               price:  60, category: "Lassi",        isActive: true, stock: null },

  // ── Shakes ──
  { name: "Banana Shake",             price:  50, category: "Shake",        isActive: true, stock: null },
  { name: "Cold Coffee",              price:  60, category: "Shake",        isActive: true, stock: null },
  { name: "Chocolate Shake",          price:  70, category: "Shake",        isActive: true, stock: null },
  { name: "Kit Kat Shake",            price:  80, category: "Shake",        isActive: true, stock: null },
  { name: "Oreo Shake",               price:  80, category: "Shake",        isActive: true, stock: null },

  // ── Tea ──
  { name: "Masala Tea",               price:  20, category: "Tea",          isActive: true, stock: null },
  { name: "Malai Tea",                price:  30, category: "Tea",          isActive: true, stock: null },
  { name: "Chili Tea",                price:  30, category: "Tea",          isActive: true, stock: null },
  { name: "Naga Tea",                 price:  30, category: "Tea",          isActive: true, stock: null },
  { name: "Tetul Tea",                price:  30, category: "Tea",          isActive: true, stock: null },
  { name: "Green Tea",                price:  50, category: "Tea",          isActive: true, stock: null },
  { name: "Rose Tea",                 price:  50, category: "Tea",          isActive: true, stock: null },
  { name: "Orthodox Tea",             price:  50, category: "Tea",          isActive: true, stock: null },
  { name: "The Arena Tea",            price:  60, category: "Tea",          isActive: true, stock: null },

  // ── Coffee ──
  { name: "Regular Coffee",           price:  70, category: "Coffee",       isActive: true, stock: null },
  { name: "Cappuccino",               price: 100, category: "Coffee",       isActive: true, stock: null },
];

// ── Turf Slots ────────────────────────────────────────────────────────────────
// Tiers: "14" = 7v7 (14 players), "16" = 8v8, "18" = 9v9
// Using REGULAR pricing from the slot schedule.
// Owner can edit prices via Manage Slots to switch to Offer pricing.

const DAY_PRICES   = { "14": 1800, "16": 2100, "18": 2400 };
const NIGHT_PRICES = { "14": 2100, "16": 2400, "18": 2700 };

const TURF_SLOTS = [
  // Day slots (2:30 PM – 6:55 PM)
  { startTime: "14:30", endTime: "15:55", isActive: true, prices: DAY_PRICES },
  { startTime: "16:00", endTime: "17:25", isActive: true, prices: DAY_PRICES },
  { startTime: "17:30", endTime: "18:55", isActive: true, prices: DAY_PRICES },
  // Night slots (7:30 PM – 4:25 AM)
  { startTime: "19:30", endTime: "20:55", isActive: true, prices: NIGHT_PRICES },
  { startTime: "21:00", endTime: "22:25", isActive: true, prices: NIGHT_PRICES },
  { startTime: "22:30", endTime: "23:55", isActive: true, prices: NIGHT_PRICES },
  { startTime: "00:00", endTime: "01:25", isActive: true, prices: NIGHT_PRICES },
  { startTime: "01:30", endTime: "02:55", isActive: true, prices: NIGHT_PRICES },
  { startTime: "03:00", endTime: "04:25", isActive: true, prices: NIGHT_PRICES },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function seedCollection(collectionName, items, label) {
  const col      = collection(db, collectionName);
  const existing = await getDocs(col);

  if (existing.size > 0) {
    console.log(`⚠️  ${label}: ${existing.size} docs already exist — skipping.`);
    return;
  }

  let count = 0;
  for (const item of items) {
    await addDoc(col, item);
    count++;
    process.stdout.write(`\r   ${label}: ${count}/${items.length} added…`);
  }
  console.log(`\n✅ ${label}: ${count} items added.`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding Rangpur Sports Arena — Firestore\n");

  // Sign in as owner so Firestore rules allow writes
  const email    = await prompt("Owner email: ");
  const password = await prompt("Password:    ");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Signed in.\n");
  } catch (err) {
    console.error("❌ Login failed:", err.message);
    process.exit(1);
  }

  await seedCollection("foodProducts", FOOD_PRODUCTS, "Food Products");
  await seedCollection("turfSlots",    TURF_SLOTS,    "Turf Slots");
  console.log("\n🎉  Done! Refresh the app to see all data.");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌  Seed failed:", err.message);
  process.exit(1);
});
