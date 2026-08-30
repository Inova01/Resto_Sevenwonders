/* =========================================================
   SEVEN WONDERS — content/home.js
   ---------------------------------------------------------
   The homepage: hero, "our story" strip, events, guest
   reviews and the closing banner.

   YOU DO NOT NEED TO EDIT THIS FILE BY HAND.
   Open  admin.html  →  "Homepage"  and press Publish.

   WHY EVENTS LIVE HERE
   They used to be written into index.html by hand, which meant
   the homepage advertised the same three nights forever. Now
   each event has a real date: past events drop off on their own
   and the whole section hides itself when nothing is coming up,
   so the site can never show a stale night again.
   ========================================================= */
window.SW_CONTENT = window.SW_CONTENT || {};

window.SW_CONTENT.home = {
  hero: {
    eyebrow: "Jacksonville, Florida",
    /* {accent} is drawn in apricot. Keep it in the title. */
    title: "Seven Wonders — {accent} in Jacksonville",
    accent: "Haitian Kitchen & Bakery",
    lead:
      "Fresh patties in the morning, griot and tasso off the grill, " +
      "and Special Menu Night when the fish comes in.",
    primaryCta: { label: "Book A Table", href: "reservation.html" },
    secondaryCta: { label: "View Menu", href: "menu.html" },
    /* Hero background. Change from the dashboard's photo picker. */
    image: "assets/gallery/gallery-07.jpeg",
    imageAlt: "A platter of Haitian food served at Seven Wonders"
  },

  about: {
    eyebrow: "Our Story",
    title: "Cooked the Way It Should Be",
    body:
      "Seven Wonders Bakery & Grill is a Haitian kitchen on University Boulevard. " +
      "We bake patties fresh every morning, marinate the griot overnight, and cook the " +
      "platters in small batches through the day instead of holding them under a lamp. " +
      "Nothing here is quick, and that is the point.",
    image: "assets/gallery/gallery-11.jpeg",
    imageAlt: "Griot pork platter at Seven Wonders",
    /* Keep these honest — they are the first thing a guest reads.
       Set `stats: []` to hide the row entirely. */
    stats: [
      { value: "Daily", label: "Fresh-baked patties" },
      { value: "4", label: "Menus — breakfast to dinner" },
      { value: "Kabrit & Pwason", label: "On Special Menu Night" }
    ]
  },

  /* ---- Events / live music --------------------------------
     `date` is ISO yyyy-mm-dd. Anything before today is hidden
     automatically. If every event has passed, the section
     disappears instead of showing old dates.
     Start with an empty list rather than inventing nights:
     add real ones from the dashboard.                        */
  events: {
    eyebrow: "Live at Seven Wonders",
    title: "Special Guests & Live Music",
    lead: "Reserve a table when there is music in the room.",
    items: []
  },

  gallery: {
    eyebrow: "Moments",
    title: "The Gallery",
    lead: "A glimpse of the plates, the room and the evenings that define Seven Wonders."
  },

  /* ---- Guest reviews -------------------------------------
     Only publish words a real guest actually said. `avatar` is
     optional — leave it "" and the card shows the guest's
     initials instead of a stock photo of a stranger.
     Empty list = the whole section is hidden.                */
  testimonials: {
    eyebrow: "Guest Words",
    title: "What Our Guests Say",
    items: []
  },

  blogPreview: {
    eyebrow: "Recent Updates",
    title: "From the Kitchen",
    lead: "Notes from the kitchen and the bakery — how the food is made, and what is on this week."
  },

  ctaBanner: {
    eyebrow: "Reserve Your Table",
    title: "Come and Eat",
    lead: "Book a table, or order ahead for pickup and delivery.",
    cta: { label: "Book A Table", href: "reservation.html" },
    image: "assets/gallery/gallery-09.jpeg"
  },

  /* Menu-of-the-Day section headings (the dish itself comes
     from content/menu.js → dailySpecial) */
  menuOfDay: {
    badge: "Menu of the Day",
    ctaLabel: "Book A Table",
    ctaHref: "reservation.html"
  }
};
