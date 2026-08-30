/* =========================================================
   SEVEN WONDERS — content/shop.js
   ---------------------------------------------------------
   The Shop page grid. These are the things a guest can buy
   to take away, priced from the real menu.

   YOU DO NOT NEED TO EDIT THIS FILE BY HAND.
   Open  admin.html  →  "Shop"  and press Publish.

   FIELDS
     id        unique slug
     name      shown on the card
     note      small line under the name ("" hides it)
     price     the normal price
     sale      a lower price, or null for no sale. When set,
               the card shows the old price struck through
               and a "Sale!" badge.
     inStock   false = card shows "Sold out", button disabled
     img       photo path, or "" for the fork placeholder.
               Pick one visually in the dashboard — it lists
               every photo in assets/gallery/.
   ========================================================= */
window.SW_CONTENT = window.SW_CONTENT || {};

window.SW_CONTENT.shop = {
  /* Options offered in the "Sort by" dropdown. The count line
     above the grid is calculated from the products below, so it
     can never disagree with what is on screen again. */
  sortOptions: [
    "Default sorting",
    "Sort by price: low to high",
    "Sort by price: high to low",
    "Sort by name"
  ],

  products: [
    {
      id: "pate-fete-box",
      name: "Pate Fête — Box of 12",
      note: "Meat or Aransò · fresh every morning",
      price: 12.42,
      sale: null,
      inStock: true,
      img: ""
    },
    {
      id: "patte-kode-meat-shop",
      name: "Patte Kòde",
      note: "Meat",
      price: 6.21,
      sale: null,
      inStock: true,
      img: ""
    },
    {
      id: "griot-platter-shop",
      name: "Griot Pork Platter",
      note: "With rice & beans and banana pesé",
      price: 17.60,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-11.jpeg"
    },
    {
      id: "chicken-wings-shop",
      name: "7 Chicken Wings",
      note: "Full platter",
      price: 13.46,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-16.jpeg"
    },
    {
      id: "turkey-platter-shop",
      name: "Turkey Platter",
      note: "Kodenn",
      price: 19.67,
      sale: null,
      inStock: true,
      img: ""
    },
    {
      id: "legume-platter-shop",
      name: "Legume Platter",
      note: "Slow-cooked vegetable stew",
      price: 20.70,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-12.jpeg"
    },
    {
      id: "bouillon-kabrit-shop",
      name: "Bouillon Kabrit",
      note: "Goat soup",
      price: 20.70,
      sale: null,
      inStock: true,
      img: ""
    },
    {
      id: "tasso-beef-shop",
      name: "Tasso Beef",
      note: "Oxtail platter",
      price: 25.88,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-02.jpeg"
    },
    {
      id: "kabrit-platter-shop",
      name: "Kabrit Platter",
      note: "Goat · Special Menu Night",
      price: 25.88,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-15.jpeg"
    },
    {
      id: "fish-platter-shop",
      name: "Fish Platter — Large",
      note: "Pwason · Special Menu Night",
      price: 36.23,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-19.jpeg"
    }
  ]
};
