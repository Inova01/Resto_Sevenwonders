/* =========================================================
   SEVEN WONDERS — content/menu.js
   ---------------------------------------------------------
   Managed from admin.html. Anything you change here by hand
   will be overwritten the next time someone presses Publish
   in the dashboard.

   Field reference: ADMIN.md
   ========================================================= */
window.SW_CONTENT = window.SW_CONTENT || {};

window.SW_CONTENT.menu = {
  "dailySpecial": {
    "mode": "auto",
    "itemId": null,
    "discountPercent": 15
  },
  "featuredIds": [
    "fish-platter-lg",
    "kabrit-platter",
    "legume-platter"
  ],
  "categories": [
    {
      "id": "breakfast",
      "label": "Breakfast",
      "photo": "assets/gallery/gallery-02.jpeg",
      "subcats": [
        {
          "id": "bk-plates",
          "label": "Plates",
          "items": [
            {
              "id": "spaghetti",
              "name": "Spaghetti",
              "desc": "Meat or Aransò",
              "price": 12.99,
              "soldOut": false,
              "img": "assets/uploads/dashboard-1hypgyi.jpg"
            },
            {
              "id": "sandwich",
              "name": "Sandwich",
              "desc": "Egg or Chicken",
              "price": 6.99,
              "soldOut": false
            }
          ]
        },
        {
          "id": "bk-patties",
          "label": "Patties",
          "items": [
            {
              "id": "patte-kode-meat",
              "name": "Patte Kòde",
              "desc": "Meat",
              "price": 7.99,
              "soldOut": false
            },
            {
              "id": "patte-kode-aranso",
              "name": "Patte Kòde",
              "desc": "Aransò",
              "price": 8.99,
              "soldOut": false
            },
            {
              "id": "pate-fete-1",
              "name": "Pate Fête (1)",
              "desc": "Meat or Aransò",
              "price": 1.25,
              "soldOut": false
            },
            {
              "id": "pate-fete-12",
              "name": "Pate Fête (Bwat) 12",
              "desc": "Meat or Aransò",
              "price": 14,
              "soldOut": false
            }
          ]
        }
      ]
    },
    {
      "id": "lunch",
      "label": "Lunch",
      "photo": "assets/gallery/gallery-05.jpeg",
      "subcats": [
        {
          "id": "ln-mains",
          "label": "Main Dishes",
          "items": [
            {
              "id": "chicken-wings-7",
              "name": "7 Chicken Wings Platter",
              "desc": "",
              "price": 12.99,
              "soldOut": false,
              "img": "assets/gallery/gallery-16.jpeg"
            },
            {
              "id": "griot-pork-platter",
              "name": "Griot Pork Platter",
              "desc": "",
              "price": 16.99,
              "soldOut": false,
              "img": "assets/gallery/gallery-11.jpeg"
            },
            {
              "id": "chicken-plate",
              "name": "Chicken Plate",
              "desc": "",
              "price": 16.99,
              "soldOut": false
            },
            {
              "id": "lunch-special",
              "name": "Lunch Special",
              "desc": "11:30 AM – 4:00 PM",
              "price": 9.99,
              "soldOut": false
            }
          ]
        },
        {
          "id": "ln-sides",
          "label": "Sides & Others",
          "items": [
            {
              "id": "salad",
              "name": "Salad",
              "desc": "",
              "price": 5,
              "soldOut": false
            },
            {
              "id": "fries",
              "name": "Fries",
              "desc": "Pomme de Terre",
              "price": 3,
              "soldOut": false
            },
            {
              "id": "rice-beans",
              "name": "Rice & Beans",
              "desc": "Diri Kole",
              "price": 6,
              "soldOut": false
            },
            {
              "id": "side-legume",
              "name": "Legume",
              "desc": "Side",
              "price": 11,
              "soldOut": false
            },
            {
              "id": "side-turkey",
              "name": "Turkey",
              "desc": "Side",
              "price": 12,
              "soldOut": false
            },
            {
              "id": "side-griot",
              "name": "Griot",
              "desc": "Side",
              "price": 10,
              "soldOut": false
            },
            {
              "id": "side-chicken",
              "name": "Chicken",
              "desc": "Side",
              "price": 10,
              "soldOut": false
            },
            {
              "id": "plantain-3",
              "name": "Plantain",
              "desc": "3 for $2",
              "price": 2,
              "soldOut": false
            },
            {
              "id": "akra-9",
              "name": "Akra",
              "desc": "9 for $6",
              "price": 6,
              "soldOut": false
            }
          ]
        }
      ]
    },
    {
      "id": "dinner",
      "label": "Dinner",
      "photo": "assets/gallery/gallery-07.jpeg",
      "subcats": [
        {
          "id": "dn-mains",
          "label": "Main Dishes",
          "items": [
            {
              "id": "legume-platter",
              "name": "Legume Platter",
              "desc": "",
              "price": 17.99,
              "soldOut": false,
              "img": "assets/gallery/gallery-12.jpeg"
            },
            {
              "id": "turkey-platter",
              "name": "Turkey Platter",
              "desc": "Kodenn",
              "price": 19.99,
              "soldOut": false
            },
            {
              "id": "fish-platter-lg",
              "name": "Fish Platter",
              "desc": "Pwason — $28 and up",
              "price": 28,
              "soldOut": false,
              "img": "assets/gallery/gallery-19.jpeg"
            },
            {
              "id": "kabrit-platter",
              "name": "Kabrit Platter",
              "desc": "Goat",
              "price": 24.99,
              "soldOut": false,
              "img": "assets/gallery/gallery-15.jpeg"
            },
            {
              "id": "kalalou-platter",
              "name": "Kalalou Platter",
              "desc": "Okra",
              "price": 24.99,
              "soldOut": false
            }
          ]
        },
        {
          "id": "dn-soups",
          "label": "Soups",
          "items": [
            {
              "id": "bouillon-kabrit",
              "name": "Bouillon Kabrit",
              "desc": "Goat Soup — Saturday only",
              "price": 19.99,
              "soldOut": false
            }
          ]
        }
      ]
    },
    {
      "id": "special",
      "label": "Special Menu Night",
      "photo": "assets/gallery/gallery-09.jpeg",
      "subcats": [
        {
          "id": "sp-night",
          "label": "Special",
          "items": [
            {
              "id": "lanbi-conch",
              "name": "Lanbi",
              "desc": "Conch",
              "price": 35,
              "soldOut": false,
              "img": "assets/gallery/gallery-19.jpeg"
            },
            {
              "id": "lalo",
              "name": "Lalo",
              "desc": "",
              "price": 25,
              "soldOut": false
            },
            {
              "id": "tonmtonm",
              "name": "Tonmtonm",
              "desc": "",
              "price": 25,
              "soldOut": false
            }
          ]
        }
      ]
    }
  ],
  "drinks": [
    {
      "id": "water",
      "name": "Water",
      "price": 1.04,
      "soldOut": false
    },
    {
      "id": "malta",
      "name": "Malta",
      "price": 3,
      "soldOut": false
    },
    {
      "id": "coconut-water",
      "name": "Coconut Water",
      "price": 3,
      "soldOut": false
    },
    {
      "id": "mystic",
      "name": "Mystic",
      "price": 2,
      "soldOut": false
    },
    {
      "id": "corossol-juice",
      "name": "Corossol Juice",
      "price": 6,
      "soldOut": false
    },
    {
      "id": "papaya-smoothie",
      "name": "Papaya Smoothies",
      "price": 6,
      "soldOut": false
    },
    {
      "id": "pineapple-smoothie",
      "name": "Pineapple Smoothies",
      "price": 2.07,
      "soldOut": false
    },
    {
      "id": "lemon-juice",
      "name": "Lemon Juice",
      "price": 6,
      "soldOut": false
    },
    {
      "id": "red-bull",
      "name": "Red Bull",
      "price": 2.5,
      "soldOut": false
    },
    {
      "id": "pina-juice",
      "name": "Pina Juice",
      "price": 6,
      "soldOut": false
    },
    {
      "id": "melon-juice",
      "name": "Melon Juice",
      "price": 1.5,
      "soldOut": false
    },
    {
      "id": "celcius-drink",
      "name": "Celcius Drink",
      "price": 2.5,
      "soldOut": false
    },
    {
      "id": "tropicana",
      "name": "Tropicana",
      "price": 3.11,
      "soldOut": false
    },
    {
      "id": "cola-couronne",
      "name": "Cola Couronne",
      "price": 3.11,
      "soldOut": false
    },
    {
      "id": "pepsi",
      "name": "Pepsi",
      "price": 3.19,
      "soldOut": false
    },
    {
      "id": "toro",
      "name": "Toro",
      "price": 4,
      "soldOut": false
    },
    {
      "id": "atomic-drink",
      "name": "Atomic Drink",
      "price": 4,
      "soldOut": false
    },
    {
      "id": "ragaman",
      "name": "Ragaman",
      "price": 4,
      "soldOut": false
    },
    {
      "id": "ak-100",
      "name": "A-K-100",
      "price": 3,
      "soldOut": false
    },
    {
      "id": "frappuccino",
      "name": "Frappuccino Coffee",
      "price": 5.18,
      "soldOut": false
    },
    {
      "id": "passion-fruit",
      "name": "Passion Fruit",
      "price": 6.21,
      "soldOut": false
    },
    {
      "id": "beer-all",
      "name": "Beer (All)",
      "price": 4,
      "soldOut": false
    },
    {
      "id": "shot-wine",
      "name": "Shot Wine",
      "price": 10,
      "soldOut": false
    }
  ],
  "desserts": []
};
