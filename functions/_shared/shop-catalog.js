/* =========================================================
   SEVEN WONDERS — functions/_shared/shop-catalog.js
   ---------------------------------------------------------
   Server-side catalog for Stripe Checkout. Managed from
   admin.html whenever Shop is published.

   Never trust prices sent from the browser. The checkout
   function imports this file and prices orders from here.
   ========================================================= */

export const SHOP_CATALOG = [
  {
    "id": "pate-fete-box",
    "name": "Pate Fête — Box of 12",
    "note": "Meat or Aransò · fresh every morning",
    "price": 14,
    "sale": null,
    "inStock": true,
    "img": ""
  },
  {
    "id": "patte-kode-meat-shop",
    "name": "Patte Kòde",
    "note": "Meat",
    "price": 7.99,
    "sale": null,
    "inStock": true,
    "img": ""
  },
  {
    "id": "griot-platter-shop",
    "name": "Griot Pork Platter",
    "note": "With rice & beans and banana pesé",
    "price": 16.99,
    "sale": null,
    "inStock": true,
    "img": "assets/gallery/gallery-11.jpeg"
  },
  {
    "id": "chicken-wings-shop",
    "name": "7 Chicken Wings Platter",
    "note": "Full platter",
    "price": 12.99,
    "sale": null,
    "inStock": true,
    "img": "assets/gallery/gallery-16.jpeg"
  },
  {
    "id": "turkey-platter-shop",
    "name": "Turkey Platter",
    "note": "Kodenn",
    "price": 19.99,
    "sale": null,
    "inStock": true,
    "img": ""
  },
  {
    "id": "legume-platter-shop",
    "name": "Legume Platter",
    "note": "Slow-cooked vegetable stew",
    "price": 17.99,
    "sale": null,
    "inStock": true,
    "img": "assets/gallery/gallery-12.jpeg"
  },
  {
    "id": "bouillon-kabrit-shop",
    "name": "Bouillon Kabrit",
    "note": "Goat soup · Saturday only",
    "price": 19.99,
    "sale": null,
    "inStock": true,
    "img": ""
  },
  {
    "id": "kalalou-platter-shop",
    "name": "Kalalou Platter",
    "note": "Okra",
    "price": 24.99,
    "sale": null,
    "inStock": true,
    "img": ""
  },
  {
    "id": "kabrit-platter-shop",
    "name": "Kabrit Platter",
    "note": "Goat · Special Menu Night",
    "price": 24.99,
    "sale": null,
    "inStock": true,
    "img": "assets/gallery/gallery-15.jpeg"
  },
  {
    "id": "fish-platter-shop",
    "name": "Fish Platter",
    "note": "Pwason · $28 and up",
    "price": 28,
    "sale": null,
    "inStock": true,
    "img": "assets/gallery/gallery-19.jpeg"
  }
];

export function effectivePrice(product) {
  return typeof product.sale === "number" && product.sale > 0 && product.sale < product.price
    ? product.sale
    : product.price;
}
