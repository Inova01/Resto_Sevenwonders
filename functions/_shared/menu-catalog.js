/* =========================================================
   SEVEN WONDERS — functions/_shared/menu-catalog.js
   ---------------------------------------------------------
   Server-side menu catalog for Stripe Checkout. Managed
   from admin.html whenever Menu & prices is published.

   Never trust prices, totals or discounts sent from the
   browser. Checkout imports this file and prices menu
   orders from here.
   ========================================================= */

export const MENU_CATALOG = [
  {
    "id": "spaghetti",
    "name": "Spaghetti",
    "desc": "Meat or Aransò",
    "price": 12.99,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "breakfast",
    "categoryLabel": "Breakfast",
    "subcatId": "bk-plates",
    "subcatLabel": "Plates"
  },
  {
    "id": "sandwich",
    "name": "Sandwich",
    "desc": "Egg or Chicken",
    "price": 6.99,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "breakfast",
    "categoryLabel": "Breakfast",
    "subcatId": "bk-plates",
    "subcatLabel": "Plates"
  },
  {
    "id": "patte-kode-meat",
    "name": "Patte Kòde",
    "desc": "Meat",
    "price": 7.99,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "breakfast",
    "categoryLabel": "Breakfast",
    "subcatId": "bk-patties",
    "subcatLabel": "Patties"
  },
  {
    "id": "patte-kode-aranso",
    "name": "Patte Kòde",
    "desc": "Aransò",
    "price": 8.99,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "breakfast",
    "categoryLabel": "Breakfast",
    "subcatId": "bk-patties",
    "subcatLabel": "Patties"
  },
  {
    "id": "pate-fete-1",
    "name": "Pate Fête (1)",
    "desc": "Meat or Aransò",
    "price": 1.25,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "breakfast",
    "categoryLabel": "Breakfast",
    "subcatId": "bk-patties",
    "subcatLabel": "Patties"
  },
  {
    "id": "pate-fete-12",
    "name": "Pate Fête (Bwat) 12",
    "desc": "Meat or Aransò",
    "price": 14,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "breakfast",
    "categoryLabel": "Breakfast",
    "subcatId": "bk-patties",
    "subcatLabel": "Patties"
  },
  {
    "id": "chicken-wings-7",
    "name": "7 Chicken Wings Platter",
    "desc": "",
    "price": 12.99,
    "soldOut": false,
    "img": "assets/gallery/gallery-16.jpeg",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-mains",
    "subcatLabel": "Main Dishes"
  },
  {
    "id": "griot-pork-platter",
    "name": "Griot Pork Platter",
    "desc": "",
    "price": 16.99,
    "soldOut": false,
    "img": "assets/gallery/gallery-11.jpeg",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-mains",
    "subcatLabel": "Main Dishes"
  },
  {
    "id": "chicken-plate",
    "name": "Chicken Plate",
    "desc": "",
    "price": 16.99,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-mains",
    "subcatLabel": "Main Dishes"
  },
  {
    "id": "lunch-special",
    "name": "Lunch Special",
    "desc": "11:30 AM – 4:00 PM",
    "price": 9.99,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-mains",
    "subcatLabel": "Main Dishes"
  },
  {
    "id": "salad",
    "name": "Salad",
    "desc": "",
    "price": 5,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-sides",
    "subcatLabel": "Sides & Others"
  },
  {
    "id": "fries",
    "name": "Fries",
    "desc": "Pomme de Terre",
    "price": 3,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-sides",
    "subcatLabel": "Sides & Others"
  },
  {
    "id": "rice-beans",
    "name": "Rice & Beans",
    "desc": "Diri Kole",
    "price": 6,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-sides",
    "subcatLabel": "Sides & Others"
  },
  {
    "id": "side-legume",
    "name": "Legume",
    "desc": "Side",
    "price": 11,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-sides",
    "subcatLabel": "Sides & Others"
  },
  {
    "id": "side-turkey",
    "name": "Turkey",
    "desc": "Side",
    "price": 12,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-sides",
    "subcatLabel": "Sides & Others"
  },
  {
    "id": "side-griot",
    "name": "Griot",
    "desc": "Side",
    "price": 10,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-sides",
    "subcatLabel": "Sides & Others"
  },
  {
    "id": "side-chicken",
    "name": "Chicken",
    "desc": "Side",
    "price": 10,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-sides",
    "subcatLabel": "Sides & Others"
  },
  {
    "id": "plantain-3",
    "name": "Plantain",
    "desc": "3 for $2",
    "price": 2,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-sides",
    "subcatLabel": "Sides & Others"
  },
  {
    "id": "akra-9",
    "name": "Akra",
    "desc": "9 for $6",
    "price": 6,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "lunch",
    "categoryLabel": "Lunch",
    "subcatId": "ln-sides",
    "subcatLabel": "Sides & Others"
  },
  {
    "id": "legume-platter",
    "name": "Legume Platter",
    "desc": "",
    "price": 17.99,
    "soldOut": false,
    "img": "assets/gallery/gallery-12.jpeg",
    "kind": "dish",
    "categoryId": "dinner",
    "categoryLabel": "Dinner",
    "subcatId": "dn-mains",
    "subcatLabel": "Main Dishes"
  },
  {
    "id": "turkey-platter",
    "name": "Turkey Platter",
    "desc": "Kodenn",
    "price": 19.99,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "dinner",
    "categoryLabel": "Dinner",
    "subcatId": "dn-mains",
    "subcatLabel": "Main Dishes"
  },
  {
    "id": "fish-platter-lg",
    "name": "Fish Platter",
    "desc": "Pwason — $28 and up",
    "price": 28,
    "soldOut": false,
    "img": "assets/gallery/gallery-19.jpeg",
    "kind": "dish",
    "categoryId": "dinner",
    "categoryLabel": "Dinner",
    "subcatId": "dn-mains",
    "subcatLabel": "Main Dishes"
  },
  {
    "id": "kabrit-platter",
    "name": "Kabrit Platter",
    "desc": "Goat",
    "price": 24.99,
    "soldOut": false,
    "img": "assets/gallery/gallery-15.jpeg",
    "kind": "dish",
    "categoryId": "dinner",
    "categoryLabel": "Dinner",
    "subcatId": "dn-mains",
    "subcatLabel": "Main Dishes"
  },
  {
    "id": "kalalou-platter",
    "name": "Kalalou Platter",
    "desc": "Okra",
    "price": 24.99,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "dinner",
    "categoryLabel": "Dinner",
    "subcatId": "dn-mains",
    "subcatLabel": "Main Dishes"
  },
  {
    "id": "bouillon-kabrit",
    "name": "Bouillon Kabrit",
    "desc": "Goat Soup — Saturday only",
    "price": 19.99,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "dinner",
    "categoryLabel": "Dinner",
    "subcatId": "dn-soups",
    "subcatLabel": "Soups"
  },
  {
    "id": "lanbi-conch",
    "name": "Lanbi",
    "desc": "Conch",
    "price": 35,
    "soldOut": false,
    "img": "assets/gallery/gallery-19.jpeg",
    "kind": "dish",
    "categoryId": "special",
    "categoryLabel": "Special Menu Night",
    "subcatId": "sp-night",
    "subcatLabel": "Special"
  },
  {
    "id": "lalo",
    "name": "Lalo",
    "desc": "",
    "price": 25,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "special",
    "categoryLabel": "Special Menu Night",
    "subcatId": "sp-night",
    "subcatLabel": "Special"
  },
  {
    "id": "tonmtonm",
    "name": "Tonmtonm",
    "desc": "",
    "price": 25,
    "soldOut": false,
    "img": "",
    "kind": "dish",
    "categoryId": "special",
    "categoryLabel": "Special Menu Night",
    "subcatId": "sp-night",
    "subcatLabel": "Special"
  },
  {
    "id": "water",
    "name": "Water",
    "desc": "",
    "price": 1.04,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "malta",
    "name": "Malta",
    "desc": "",
    "price": 3,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "coconut-water",
    "name": "Coconut Water",
    "desc": "",
    "price": 3,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "mystic",
    "name": "Mystic",
    "desc": "",
    "price": 2,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "corossol-juice",
    "name": "Corossol Juice",
    "desc": "",
    "price": 6,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "papaya-smoothie",
    "name": "Papaya Smoothies",
    "desc": "",
    "price": 6,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "pineapple-smoothie",
    "name": "Pineapple Smoothies",
    "desc": "",
    "price": 2.07,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "lemon-juice",
    "name": "Lemon Juice",
    "desc": "",
    "price": 6,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "red-bull",
    "name": "Red Bull",
    "desc": "",
    "price": 2.5,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "pina-juice",
    "name": "Pina Juice",
    "desc": "",
    "price": 6,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "melon-juice",
    "name": "Melon Juice",
    "desc": "",
    "price": 1.5,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "celcius-drink",
    "name": "Celcius Drink",
    "desc": "",
    "price": 2.5,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "tropicana",
    "name": "Tropicana",
    "desc": "",
    "price": 3.11,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "cola-couronne",
    "name": "Cola Couronne",
    "desc": "",
    "price": 3.11,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "pepsi",
    "name": "Pepsi",
    "desc": "",
    "price": 3.19,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "toro",
    "name": "Toro",
    "desc": "",
    "price": 4,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "atomic-drink",
    "name": "Atomic Drink",
    "desc": "",
    "price": 4,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "ragaman",
    "name": "Ragaman",
    "desc": "",
    "price": 4,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "ak-100",
    "name": "A-K-100",
    "desc": "",
    "price": 3,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "frappuccino",
    "name": "Frappuccino Coffee",
    "desc": "",
    "price": 5.18,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "passion-fruit",
    "name": "Passion Fruit",
    "desc": "",
    "price": 6.21,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "beer-all",
    "name": "Beer (All)",
    "desc": "",
    "price": 4,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  },
  {
    "id": "shot-wine",
    "name": "Shot Wine",
    "desc": "",
    "price": 10,
    "soldOut": false,
    "img": "",
    "kind": "drink",
    "categoryId": "drinks",
    "categoryLabel": "Drinks",
    "subcatId": "drinks",
    "subcatLabel": "Drinks"
  }
];

export const MENU_DAILY_SPECIAL = {
  "mode": "auto",
  "itemId": null,
  "discountPercent": 15
};

export const MENU_SPECIAL_POOL_IDS = [
  "chicken-wings-7",
  "griot-pork-platter",
  "chicken-plate",
  "lunch-special",
  "legume-platter",
  "turkey-platter",
  "fish-platter-lg",
  "kabrit-platter",
  "kalalou-platter",
  "lanbi-conch",
  "lalo",
  "tonmtonm"
];

function seedOf(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return h >>> 0;
}

export function findMenuProduct(id) {
  return MENU_CATALOG.find((item) => item.id === id) || null;
}

export function pickDailySpecial(date = new Date()) {
  const pool = MENU_SPECIAL_POOL_IDS.map(findMenuProduct)
    .filter((item) => item && item.soldOut !== true && typeof item.price === "number" && item.price > 0);
  if (!pool.length) return null;
  if (MENU_DAILY_SPECIAL.mode === "manual" && MENU_DAILY_SPECIAL.itemId) {
    const pinned = pool.find((item) => item.id === MENU_DAILY_SPECIAL.itemId);
    if (pinned) return pinned;
  }
  const d = new Date(2020, 0, 1);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let idx = 0, prev = -1;
  while (d <= end) {
    idx = hash(seedOf(d)) % pool.length;
    if (pool.length > 1 && idx === prev) idx = (idx + 1) % pool.length;
    prev = idx;
    d.setDate(d.getDate() + 1);
  }
  return pool[idx];
}

export function effectiveMenuPrice(item, date = new Date()) {
  if (!item || typeof item.price !== "number" || !(item.price > 0)) return null;
  const special = pickDailySpecial(date);
  const pct = Math.max(0, Math.min(90, Number(MENU_DAILY_SPECIAL.discountPercent) || 0));
  if (special && special.id === item.id && pct > 0) {
    return Math.round(item.price * (1 - pct / 100) * 2) / 2;
  }
  return item.price;
}
