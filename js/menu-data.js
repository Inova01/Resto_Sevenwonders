/* =========================================================
   SEVEN WONDERS RESTAURANT & BAKERY - menu-data.js
   Single source of truth for the menu tabs and order section.
   Transcribed from the updated printed menu photos in assets/menu/.
   ========================================================= */
(function () {
  "use strict";

  window.SW_MENU = {
    info: {
      name: "Seven Wonders Restaurant & Bakery",
      address: "2145 University Blvd N, Jacksonville FL 32211",
      phone: "904 402 9212",
    },

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
              { id: "spaghetti", name: "Spaghetti", desc: "Meat or Aranso", price: 12.99 },
              { id: "sandwich", name: "Sandwich", desc: "Egg or Chicken", price: 6.99 },
            ],
          },
          {
            id: "bk-patties",
            label: "Patties",
            items: [
              { id: "patte-kode-meat", name: "Patte Kode", desc: "Meat", price: 7.99 },
              { id: "patte-kode-aranso", name: "Patte Kode", desc: "Aranso", price: 8.99 },
              { id: "pate-fete-1", name: "Pate Fete (1)", desc: "Meat or Aranso", price: 1.25 },
              { id: "pate-fete-12", name: "Pate Fete (Bwat) 12", desc: "Meat or Aranso", price: 14.00 },
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
              { id: "chicken-wings-7", name: "7 Chicken Wings Platter", desc: "", price: 12.99 },
              { id: "griot-pork-platter", name: "Griot Pork Platter", desc: "", price: 16.99 },
              { id: "chicken-plate", name: "Chicken Plate", desc: "", price: 16.99 },
              { id: "lunch-special", name: "Lunch Special", desc: "11:30 AM - 4:00 PM", price: 9.99 },
            ],
          },
          {
            id: "ln-sides",
            label: "Sides & Others",
            items: [
              { id: "salad", name: "Salad", desc: "", price: 5.00 },
              { id: "fries", name: "Fries", desc: "Pomme de Terre", price: 3.00 },
              { id: "rice-beans", name: "Rice & Beans", desc: "Diri Kole", price: 6.00 },
              { id: "side-legume", name: "Legume", desc: "Side", price: 11.00 },
              { id: "side-turkey", name: "Turkey", desc: "Side", price: 12.00 },
              { id: "side-griot", name: "Griot", desc: "Side", price: 10.00 },
              { id: "side-chicken", name: "Chicken", desc: "Side", price: 10.00 },
              { id: "plantain-3", name: "Plantain", desc: "3 for $2", price: 2.00 },
              { id: "akra-9", name: "Akra", desc: "9 for $6", price: 6.00 },
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
              { id: "legume-platter", name: "Legume Platter", desc: "", price: 17.99 },
              { id: "turkey-platter", name: "Turkey Platter", desc: "Kodenn", price: 19.99 },
              { id: "fish-platter-lg", name: "Fish Platter (Pwason)", desc: "Pwason - $28 and up", price: 28.00 },
              { id: "kabrit-platter", name: "Kabrit Platter", desc: "Goat", price: 24.99 },
              { id: "kalalou-platter", name: "Kalalou Platter", desc: "Okra", price: 24.99 },
            ],
          },
          {
            id: "dn-soups",
            label: "Soups",
            items: [
              { id: "bouillon-kabrit", name: "Bouillon Kabrit", desc: "Goat Soup - Saturday only", price: 19.99 },
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
            id: "sp-night",
            label: "Special",
            items: [
              { id: "lanbi-conch", name: "Lanbi", desc: "Conch", price: 35.00 },
              { id: "lalo", name: "Lalo", desc: "", price: 25.00 },
              { id: "tonmtonm", name: "Tonmtonm", desc: "", price: 25.00 },
            ],
          },
        ],
      },
    ],

    drinks: [
      { id: "water", name: "Water", price: 1.04 },
      { id: "malta", name: "Malta", price: 3.00 },
      { id: "coconut-water", name: "Coconut Water", price: 3.00 },
      { id: "mystic", name: "Mystic", price: 2.00 },
      { id: "corossol-juice", name: "Corossol Juice", price: 6.00 },
      { id: "papaya-smoothie", name: "Papaya Smoothies", price: 6.00 },
      { id: "pineapple-smoothie", name: "Pineapple Smoothies", price: 2.07 },
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

    desserts: [],
  };
})();
