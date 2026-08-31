/* =========================================================
   SEVEN WONDERS — content/about.js
   ---------------------------------------------------------
   The About page: the founding story, the two founders, the
   photos of the restaurant, and the closing "visit us" block.

   YOU DO NOT NEED TO EDIT THIS FILE BY HAND.
   Open  admin.html  →  "About page"  and press Publish.

   WHY THE ADDRESS IS NOT IN HERE
   The "Visit us" block at the bottom prints the address, the
   phone number and nothing else that is typed twice — it reads
   them from content/settings.js, the same as every footer. Move
   premises or change the phone number in ONE place and the About
   page follows.

   FIELDS
     hero      the photo banner at the top
     intro     the story, next to the founder portraits
     founders  the portrait cards; `people: []` hides the block
     detail    the photo stack and the rest of the story
     visit     the closing block. Its address and phone come
               from settings; only the wording is here.

   Each `body` is a LIST of paragraphs — one string per
   paragraph. Keep them plain text: they are written to the page
   as text, never as markup, so nothing typed in the dashboard
   can break the page or inject a script.
   ========================================================= */
window.SW_CONTENT = window.SW_CONTENT || {};

window.SW_CONTENT.about = {
  hero: {
    eyebrow: "Our Story",
    title: "Welcome to Seven Wonders Restaurant & Bakery",
    image: "assets/restaurant/seven-wonders-exterior.jpeg",
    imageAlt: "The Seven Wonders Restaurant & Bakery storefront"
  },

  intro: {
    eyebrow: "Family Founded",
    title: "Tradition, family, and authentic Caribbean hospitality.",
    body: [
      "At Seven Wonders Restaurant & Bakery, every meal tells a story of tradition, family, and authentic Caribbean hospitality.",
      "Founded on November 24, 2018, by Oswald Gaboyau and Marjorie Gaboyau, Seven Wonders began as a small Haitian bakery with a passion for creating fresh bread and pastries inspired by the rich culinary traditions of Haiti. Thanks to the unwavering support of our customers, the business quickly expanded into a full-service Haitian & Caribbean restaurant, becoming one of Jacksonville's favorite destinations for authentic island cuisine.",
      "Our mission is simple: to bring people together through exceptional food, warm hospitality, and unforgettable experiences. Every dish is carefully prepared using fresh ingredients, traditional recipes, and the homemade flavors that remind our guests of home."
    ]
  },

  /* The portrait cards beside the story. Set `people: []` and the
     whole block disappears rather than leaving an empty column. */
  founders: {
    label: "Seven Wonders owners",
    people: [
      {
        name: "Oswald Gaboyau",
        role: "Founder",
        photo: "assets/restaurant/oswald-gaboyau.jpeg",
        photoAlt: "Oswald Gaboyau, co-founder of Seven Wonders"
      },
      {
        name: "Marjorie Gaboyau",
        role: "Founder",
        photo: "assets/restaurant/marjorie-gaboyau.jpeg",
        photoAlt: "Marjorie Gaboyau, co-founder of Seven Wonders"
      }
    ]
  },

  detail: {
    photos: [
      {
        src: "assets/restaurant/seven-wonders-dining-room-front.jpeg",
        alt: "The Seven Wonders dining room, warmly lit"
      },
      {
        src: "assets/restaurant/seven-wonders-dining-room-art.jpeg",
        alt: "The Seven Wonders dining room, with Haitian artwork on the wall"
      }
    ],
    body: [
      "Seven Wonders has become known for its signature Haitian Rice & Beans (Diri Kole), Griot, Tassot, Legume, Fried Fish, Soup Joumou, freshly baked Haitian bread, delicious pastries, and handcrafted Caribbean specialties. Every meal reflects the passion, culture, and excellence that define our restaurant.",
      "Since opening our doors, we have proudly served thousands of satisfied guests and successfully catered more than 200 weddings, birthday celebrations, corporate events, church gatherings, family reunions, and private parties throughout Jacksonville and the surrounding communities. Every event we serve is treated with the same dedication and attention to detail that has earned the trust of our customers.",
      "At Seven Wonders, we believe that great food is more than a meal — it is an experience that creates memories, brings families together, and celebrates our rich Haitian and Caribbean heritage. Whether you are joining us for lunch, dinner, catering, or simply stopping by for fresh bread and pastries, our team is committed to making every visit memorable.",
      "We invite you to discover the authentic taste of Haiti and the Caribbean in a warm, welcoming atmosphere where every guest is treated like family."
    ],
    /* Printed in bold under the paragraphs. Leave "" to hide it. */
    closing: "Seven Wonders Restaurant & Bakery — Authentic Haitian & Caribbean Cuisine, Freshly Baked Daily, Served with Passion."
  },

  /* Closing block. The address and phone are NOT typed here —
     they come from content/settings.js. */
  visit: {
    eyebrow: "Visit Us",
    title: "Seven Wonders Restaurant & Bakery",
    primaryCta: { label: "Pay Online", href: "shop.html" },
    secondaryCta: { label: "View Menu", href: "menu.html" }
  }
};
