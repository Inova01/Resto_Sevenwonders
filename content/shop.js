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
     paymentLink optional Stripe Payment Link URL. Leave blank
               to keep the normal add-to-cart button.
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
      price: 14.00,
      sale: null,
      inStock: true,
      img: "",
      paymentLink: ""
    },
    {
      id: "patte-kode-meat-shop",
      name: "Patte Kòde",
      note: "Meat",
      price: 7.99,
      sale: null,
      inStock: true,
      img: "",
      paymentLink: ""
    },
    {
      id: "griot-platter-shop",
      name: "Griot Pork Platter",
      note: "With rice & beans and banana pesé",
      price: 16.99,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-11.jpeg",
      paymentLink: ""
    },
    {
      id: "chicken-wings-shop",
      name: "7 Chicken Wings Platter",
      note: "Full platter",
      price: 12.99,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-16.jpeg",
      paymentLink: ""
    },
    {
      id: "turkey-platter-shop",
      name: "Turkey Platter",
      note: "Kodenn",
      price: 19.99,
      sale: null,
      inStock: true,
      img: "",
      paymentLink: ""
    },
    {
      id: "legume-platter-shop",
      name: "Legume Platter",
      note: "Slow-cooked vegetable stew",
      price: 17.99,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-12.jpeg",
      paymentLink: ""
    },
    {
      id: "bouillon-kabrit-shop",
      name: "Bouillon Kabrit",
      note: "Goat soup · Saturday only",
      price: 19.99,
      sale: null,
      inStock: true,
      img: "",
      paymentLink: ""
    },
    {
      id: "kalalou-platter-shop",
      name: "Kalalou Platter",
      note: "Okra",
      price: 24.99,
      sale: null,
      inStock: true,
      img: "",
      paymentLink: ""
    },
    {
      id: "kabrit-platter-shop",
      name: "Kabrit Platter",
      note: "Goat · Special Menu Night",
      price: 24.99,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-15.jpeg",
      paymentLink: ""
    },
    {
      id: "fish-platter-shop",
      name: "Fish Platter",
      note: "Pwason · $28 and up",
      price: 28.00,
      sale: null,
      inStock: true,
      img: "assets/gallery/gallery-19.jpeg",
      paymentLink: ""
    }
  ]
};
