/* =========================================================
   SEVEN WONDERS — content/gallery.js
   ---------------------------------------------------------
   Every photo used by the gallery, in display order.

   YOU DO NOT NEED TO EDIT THIS FILE BY HAND.
   Open  admin.html  →  "Gallery". You can reorder photos,
   write their alt text, hide one, and choose the seven that
   appear on the homepage.

   ADDING A NEW PHOTO
     1. Put the file in  assets/gallery/
     2. Dashboard → Gallery → "Add photo" → type the filename
   (A static site cannot upload the image file itself, so the
   file has to be committed to the repo — the dashboard tells
   you if a path it was given does not load.)

   FIELDS
     src      path to the file
     alt      description read by screen readers. Empty = a
              generic fallback is used; please fill these in.
     hidden   true = kept in the list but not shown to guests
   ========================================================= */
window.SW_CONTENT = window.SW_CONTENT || {};

window.SW_CONTENT.gallery = {
  /* The seven photos in the homepage mosaic. Must be paths that
     also appear in `images` below. */
  homepage: [
    "assets/gallery/gallery-07.jpeg",
    "assets/gallery/gallery-02.jpeg",
    "assets/gallery/gallery-11.jpeg",
    "assets/gallery/gallery-12.jpeg",
    "assets/gallery/gallery-19.jpeg",
    "assets/gallery/gallery-15.jpeg",
    "assets/gallery/gallery-16.jpeg"
  ],

  images: [
    { src: "assets/gallery/gallery-01.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-02.jpeg", alt: "Tasso beef with peppers and onions", hidden: false },
    { src: "assets/gallery/gallery-03.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-04.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-05.jpeg", alt: "A lunch platter at Seven Wonders", hidden: false },
    { src: "assets/gallery/gallery-06.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-07.jpeg", alt: "A dinner platter at Seven Wonders", hidden: false },
    { src: "assets/gallery/gallery-08.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-09.jpeg", alt: "Special Menu Night at Seven Wonders", hidden: false },
    { src: "assets/gallery/gallery-10.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-11.jpeg", alt: "Griot pork platter", hidden: false },
    { src: "assets/gallery/gallery-12.jpeg", alt: "Legume platter", hidden: false },
    { src: "assets/gallery/gallery-13.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-14.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-15.jpeg", alt: "Kabrit platter", hidden: false },
    { src: "assets/gallery/gallery-16.jpeg", alt: "Seven chicken wings platter", hidden: false },
    { src: "assets/gallery/gallery-17.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-18.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-19.jpeg", alt: "Fish platter — pwason", hidden: false },
    { src: "assets/gallery/gallery-20.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-21.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-22.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-23.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-24.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-25.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-26.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-27.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-28.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-29.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-30.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-31.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-32.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-33.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-34.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-35.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-36.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-37.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-38.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-39.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-40.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-41.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-42.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-43.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-44.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-45.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-46.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-47.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-48.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-49.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-50.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-51.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-52.jpeg", alt: "", hidden: false },
    { src: "assets/gallery/gallery-53.jpeg", alt: "", hidden: false },

    /* The restaurant itself. The two founder portraits are hidden
       from the public gallery grid on purpose - they belong to the
       About page, not to a lightbox of food. Untick "Hidden" in the
       dashboard if you want them in the gallery too. */
    { src: "assets/restaurant/seven-wonders-exterior.jpeg", alt: "The Seven Wonders Restaurant & Bakery storefront on University Boulevard", hidden: false },
    { src: "assets/restaurant/seven-wonders-dining-room-front.jpeg", alt: "The Seven Wonders dining room, warmly lit", hidden: false },
    { src: "assets/restaurant/seven-wonders-dining-room-art.jpeg", alt: "The Seven Wonders dining room, with Haitian artwork on the wall", hidden: false },
    { src: "assets/restaurant/oswald-gaboyau.jpeg", alt: "Oswald Gaboyau, co-founder of Seven Wonders", hidden: true },
    { src: "assets/restaurant/marjorie-gaboyau.jpeg", alt: "Marjorie Gaboyau, co-founder of Seven Wonders", hidden: true }
  ]
};
