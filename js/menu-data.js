/* =========================================================
   SEVEN WONDERS BAKERY & GRILL — menu-data.js
   Single source of truth for the whole menu + order section.
   Transcribed from the printed menu photos (assets/menu/menu-1.jpeg,
   assets/menu/menu-2.jpeg). Edit prices/names/items HERE — the menu
   UI, the order builder and the add-ons all render from this object.

   PRICE RULES:
   - price: a number in USD, OR null when the printed menu says the
     price is "variable". When price is null, set priceLabel and the
     order builder shows it as "price varies" (excluded from the total,
     staff confirm on order).

   NOTES ON THE SOURCE MENU (see report):
   - The printed menu has one combined "LUNCH & DINNER" section; it has
     been split across the Lunch / Dinner / Special Menu Night tabs by
     dish type (see each category below).
   - There are NO desserts on the printed menu, so the "Add a Dessert"
     add-on has no items and is hidden until desserts are added here.
   ========================================================= */
(function () {
  "use strict";

  window.SW_MENU = {
    info: {
      name: "Seven Wonders Bakery & Grill",
      address: "2145 University Blvd N, Jacksonville FL 32211",
      phone: "904 402 9212",
    },

    /* ---- Four top-level categories (the MENU tab's first row) ---- */
    categories: [
      {
        id: "breakfast",
        label: "Breakfast",
        photo: "assets/gallery/gallery-02.jpeg",
        subcats: [
          {
            id: "bk-plates",
            label: "Plates",
            items: [
              { id: "spaghetti", name: "Spaghetti", desc: "Meat or Aransò", price: null, priceLabel: "Variable" },
              { id: "sandwich", name: "Sandwich", desc: "Egg or Chicken", price: 6 },
            ],
          },
          {
            id: "bk-patties",
            label: "Patties",
            items: [
              { id: "patte-kode-meat", name: "Patte Kòde", desc: "Meat", price: 6.21 },
              { id: "patte-kode-aranso", name: "Patté Kòde", desc: "Aransò", price: 7.25 },
              { id: "pate-fete-1", name: "Pate Fete (1)", desc: "Meat or Aransò", price: 1.24 },
              { id: "pate-fete-12", name: "Pate Fête (Bwat) 12", desc: "Meat or Aransò", price: 12.42 },
            ],
          },
        ],
      },

      {
        id: "lunch",
        label: "Lunch",
        photo: "assets/gallery/gallery-05.jpeg",
        subcats: [
          {
            id: "ln-mains",
            label: "Main Dishes",
            items: [
              { id: "chicken-wings-7", name: "7 Chicken Wings", desc: "", price: 13.46 },
              { id: "side-chicken", name: "Side Chicken", desc: "", price: 10.43 },
              { id: "griot-pork-platter", name: "Griot Pork Platter", desc: "", price: 17.60 },
              { id: "side-griot", name: "Side Griot", desc: "", price: 12.42 },
              { id: "fritay", name: "Fritay", desc: "Variable", price: null, priceLabel: "Variable" },
            ],
          },
          {
            id: "ln-sides",
            label: "Sides",
            items: [
              { id: "salad", name: "Salad", desc: "", price: 5.00 },
              { id: "fries", name: "Fries", desc: "Pomme de Terre", price: 3.00 },
              { id: "rice-beans", name: "Rice & Beans", desc: "Diri Kole", price: 6.00 },
              { id: "side-diri", name: "Side Diri", desc: "Rice", price: 6.21 },
              { id: "side-banana-3", name: "Side Banana 3 Pics", desc: "", price: 4.14 },
              { id: "side-banana-7", name: "Side Banana 7 Pics", desc: "", price: 9.40 },
              { id: "side-acra", name: "Side Acra", desc: "", price: 6.21 },
            ],
          },
        ],
      },

      {
        id: "dinner",
        label: "Dinner",
        photo: "assets/gallery/gallery-07.jpeg",
        subcats: [
          {
            id: "dn-mains",
            label: "Main Dishes",
            items: [
              { id: "turkey-platter", name: "Turkey Platter", desc: "Kodenn", price: 19.67 },
              { id: "side-turkey", name: "Side Turkey", desc: "Kodenn", price: 13.46 },
              { id: "legume-platter", name: "Legume Platter", desc: "", price: 20.70 },
              { id: "kalalou-platter", name: "Kalalou Platter", desc: "Okra", price: 21.83 },
              { id: "tasso-beef", name: "Tasso Beef", desc: "Oxtail Platter", price: 25.88 },
            ],
          },
          {
            id: "dn-soups",
            label: "Soups",
            items: [
              { id: "bouillon-kabrit", name: "Bouillon Kabrit", desc: "Goat Soup", price: 20.70 },
            ],
          },
        ],
      },

      {
        id: "special",
        label: "Special Menu Night",
        photo: "assets/gallery/gallery-09.jpeg",
        subcats: [
          {
            id: "sp-seafood",
            label: "Seafood (Pwason)",
            items: [
              { id: "fish-platter-sm", name: "Fish Platter", desc: "Pwason · Small", price: 31.05 },
              { id: "fish-platter-md", name: "Fish Platter", desc: "Pwason · Medium", price: 33.12 },
              { id: "fish-platter-lg", name: "Fish Platter", desc: "Pwason · Large", price: 36.23 },
              { id: "fish-platter-xl", name: "Fish Platter", desc: "Pwason · XL", price: 41.40, badge: "New" },
            ],
          },
          {
            id: "sp-goat",
            label: "Goat (Kabrit)",
            items: [
              { id: "kabrit-platter", name: "Kabrit Platter", desc: "Goat", price: 25.88, badge: "New" },
              { id: "side-kabrit", name: "Side Kabrit", desc: "Goat", price: 18.63 },
            ],
          },
        ],
      },
    ],

    /* ---- Add-on pools (rendered in the Order section) ---- */
    /* Drinks: every beverage from the printed menu (menu-1 BEVERAGE +
       all of menu-2). Shown as multi-select checkbox cards. */
    drinks: [
      { id: "water", name: "Water", price: 1.04 },
      { id: "malta", name: "Malta", price: 3.00 },
      { id: "coconut-water", name: "Coconut Water", price: 3.00 },
      { id: "mystic", name: "Mystic", price: 2.00 },
      { id: "corossol-juice", name: "Corossol Juice", price: 6.00 },
      { id: "papaya-smoothie", name: "Papaya Smoothie", price: 6.00 },
      { id: "pineapple-smoothie", name: "Pineapple Smoothie", price: 2.07 },
      { id: "lemon-juice", name: "Lemon Juice", price: 6.00 },
      { id: "red-bull", name: "Red Bull", price: 2.50 },
      { id: "pina-juice", name: "Pina Juice", price: 6.00 },
      { id: "melon-juice", name: "Melon Juice", price: 1.50 },
      { id: "celcius-drink", name: "Celcius Drink", price: 2.50 },
      { id: "tropicana", name: "Tropicana", price: 3.11 },
      { id: "cola-couronne", name: "Cola Couronne", price: 3.11 },
      { id: "pepsi", name: "Pepsi", price: 3.19 },
      { id: "toro", name: "Toro", price: 4.00 },
      { id: "atomic-drink", name: "Atomic Drink", price: 4.00 },
      { id: "ragaman", name: "Ragaman", price: 4.00 },
      { id: "ak-100", name: "A-K-100", price: 3.00 },
      { id: "frappuccino", name: "Frappuccino Coffee", price: 5.18 },
      { id: "passion-fruit", name: "Passion Fruit", price: 6.21 },
      { id: "beer-all", name: "Beer (All)", price: 4.00 },
      { id: "shot-wine", name: "Shot Wine", price: 10.00 },
    ],

    /* Desserts: none on the printed menu. Add dessert items here
       (same shape as drinks) to enable the "Add a Dessert" group. */
    desserts: [],
  };
})();
