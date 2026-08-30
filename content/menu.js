/* =========================================================
   SEVEN WONDERS — content/menu.js
   ---------------------------------------------------------
   The whole menu: categories → sub-categories → dishes, plus
   the drinks and desserts pools used by the online order
   builder. Transcribed from the printed menu photos
   (assets/menu/menu-1.jpeg, assets/menu/menu-2.jpeg).

   YOU DO NOT NEED TO EDIT THIS FILE BY HAND.
   Open  admin.html  →  "Menu"  and press Publish.

   FIELDS ON A DISH
     id         unique slug — do not reuse one; the order
                builder and the daily special key off it
     name       shown to guests
     desc       short line under the name ("" hides it)
     price      number in USD, or null for "price varies"
     priceLabel shown instead of a price when price is null
     soldOut    true = removed from the menu, the order builder,
                the daily special and the homepage until you
                switch it back on
     badge      small tag, e.g. "New"
     img        optional photo path (falls back to a fork icon)
   ========================================================= */
window.SW_CONTENT = window.SW_CONTENT || {};

window.SW_CONTENT.menu = {
  /* ---- Menu of the Day ----------------------------------
     mode "auto"   : the site picks one main dish per day from
                     Lunch, Dinner and Special Menu Night,
                     seeded from the date so every visitor sees
                     the same dish and it rotates at midnight.
     mode "manual" : always show itemId (pick it in the
                     dashboard). Use this for a real special.
     discountPercent is taken off the normal price and rounded
     to the nearest 50¢.                                     */
  dailySpecial: {
    mode: "auto",
    itemId: null,
    discountPercent: 15
  },

  /* ---- Homepage "Featured Dishes" -----------------------
     Three dish ids. Names, prices and photos are pulled from
     the menu below, so a price change updates the homepage
     too — no second place to forget.                        */
  featuredIds: ["fish-platter-lg", "tasso-beef", "legume-platter"],

  /* ---- Four top-level categories ---- */
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
            { id: "spaghetti", name: "Spaghetti", desc: "Meat or Aransò", price: null, priceLabel: "Variable", soldOut: false },
            { id: "sandwich", name: "Sandwich", desc: "Egg or Chicken", price: 6, soldOut: false }
          ]
        },
        {
          id: "bk-patties",
          label: "Patties",
          items: [
            { id: "patte-kode-meat", name: "Patte Kòde", desc: "Meat", price: 6.21, soldOut: false },
            { id: "patte-kode-aranso", name: "Patté Kòde", desc: "Aransò", price: 7.25, soldOut: false },
            { id: "pate-fete-1", name: "Pate Fete (1)", desc: "Meat or Aransò", price: 1.24, soldOut: false },
            { id: "pate-fete-12", name: "Pate Fête (Bwat) 12", desc: "Meat or Aransò", price: 12.42, soldOut: false }
          ]
        }
      ]
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
            { id: "chicken-wings-7", name: "7 Chicken Wings", desc: "", price: 13.46, soldOut: false, img: "assets/gallery/gallery-16.jpeg" },
            { id: "side-chicken", name: "Side Chicken", desc: "", price: 10.43, soldOut: false },
            { id: "griot-pork-platter", name: "Griot Pork Platter", desc: "", price: 17.60, soldOut: false, img: "assets/gallery/gallery-11.jpeg" },
            { id: "side-griot", name: "Side Griot", desc: "", price: 12.42, soldOut: false },
            { id: "fritay", name: "Fritay", desc: "Variable", price: null, priceLabel: "Variable", soldOut: false }
          ]
        },
        {
          id: "ln-sides",
          label: "Sides",
          items: [
            { id: "salad", name: "Salad", desc: "", price: 5.00, soldOut: false },
            { id: "fries", name: "Fries", desc: "Pomme de Terre", price: 3.00, soldOut: false },
            { id: "rice-beans", name: "Rice & Beans", desc: "Diri Kole", price: 6.00, soldOut: false },
            { id: "side-diri", name: "Side Diri", desc: "Rice", price: 6.21, soldOut: false },
            { id: "side-banana-3", name: "Side Banana 3 Pics", desc: "", price: 4.14, soldOut: false },
            { id: "side-banana-7", name: "Side Banana 7 Pics", desc: "", price: 9.40, soldOut: false },
            { id: "side-acra", name: "Side Acra", desc: "", price: 6.21, soldOut: false }
          ]
        }
      ]
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
            { id: "turkey-platter", name: "Turkey Platter", desc: "Kodenn", price: 19.67, soldOut: false },
            { id: "side-turkey", name: "Side Turkey", desc: "Kodenn", price: 13.46, soldOut: false },
            { id: "legume-platter", name: "Legume Platter", desc: "", price: 20.70, soldOut: false, img: "assets/gallery/gallery-12.jpeg" },
            { id: "kalalou-platter", name: "Kalalou Platter", desc: "Okra", price: 21.83, soldOut: false },
            { id: "tasso-beef", name: "Tasso Beef", desc: "Oxtail Platter", price: 25.88, soldOut: false, img: "assets/gallery/gallery-02.jpeg" }
          ]
        },
        {
          id: "dn-soups",
          label: "Soups",
          items: [
            { id: "bouillon-kabrit", name: "Bouillon Kabrit", desc: "Goat Soup", price: 20.70, soldOut: false }
          ]
        }
      ]
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
            { id: "fish-platter-sm", name: "Fish Platter", desc: "Pwason · Small", price: 31.05, soldOut: false, img: "assets/gallery/gallery-19.jpeg" },
            { id: "fish-platter-md", name: "Fish Platter", desc: "Pwason · Medium", price: 33.12, soldOut: false, img: "assets/gallery/gallery-19.jpeg" },
            { id: "fish-platter-lg", name: "Fish Platter", desc: "Pwason · Large", price: 36.23, soldOut: false, img: "assets/gallery/gallery-19.jpeg" },
            { id: "fish-platter-xl", name: "Fish Platter", desc: "Pwason · XL", price: 41.40, badge: "New", soldOut: false, img: "assets/gallery/gallery-19.jpeg" }
          ]
        },
        {
          id: "sp-goat",
          label: "Goat (Kabrit)",
          items: [
            { id: "kabrit-platter", name: "Kabrit Platter", desc: "Goat", price: 25.88, badge: "New", soldOut: false, img: "assets/gallery/gallery-15.jpeg" },
            { id: "side-kabrit", name: "Side Kabrit", desc: "Goat", price: 18.63, soldOut: false }
          ]
        }
      ]
    }
  ],

  /* ---- Drinks: shown as add-on cards in the order builder ---- */
  drinks: [
    { id: "water", name: "Water", price: 1.04, soldOut: false },
    { id: "malta", name: "Malta", price: 3.00, soldOut: false },
    { id: "coconut-water", name: "Coconut Water", price: 3.00, soldOut: false },
    { id: "mystic", name: "Mystic", price: 2.00, soldOut: false },
    { id: "corossol-juice", name: "Corossol Juice", price: 6.00, soldOut: false },
    { id: "papaya-smoothie", name: "Papaya Smoothie", price: 6.00, soldOut: false },
    { id: "pineapple-smoothie", name: "Pineapple Smoothie", price: 2.07, soldOut: false },
    { id: "lemon-juice", name: "Lemon Juice", price: 6.00, soldOut: false },
    { id: "red-bull", name: "Red Bull", price: 2.50, soldOut: false },
    { id: "pina-juice", name: "Pina Juice", price: 6.00, soldOut: false },
    { id: "melon-juice", name: "Melon Juice", price: 1.50, soldOut: false },
    { id: "celcius-drink", name: "Celcius Drink", price: 2.50, soldOut: false },
    { id: "tropicana", name: "Tropicana", price: 3.11, soldOut: false },
    { id: "cola-couronne", name: "Cola Couronne", price: 3.11, soldOut: false },
    { id: "pepsi", name: "Pepsi", price: 3.19, soldOut: false },
    { id: "toro", name: "Toro", price: 4.00, soldOut: false },
    { id: "atomic-drink", name: "Atomic Drink", price: 4.00, soldOut: false },
    { id: "ragaman", name: "Ragaman", price: 4.00, soldOut: false },
    { id: "ak-100", name: "A-K-100", price: 3.00, soldOut: false },
    { id: "frappuccino", name: "Frappuccino Coffee", price: 5.18, soldOut: false },
    { id: "passion-fruit", name: "Passion Fruit", price: 6.21, soldOut: false },
    { id: "beer-all", name: "Beer (All)", price: 4.00, soldOut: false },
    { id: "shot-wine", name: "Shot Wine", price: 10.00, soldOut: false }
  ],

  /* ---- Desserts: none on the printed menu yet.
     Add one from the dashboard and the "Add a Dessert" group
     appears in the order builder on its own. ---- */
  desserts: []
};
