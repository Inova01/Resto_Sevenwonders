/* =========================================================
   SEVEN WONDERS — content/blog.js
   ---------------------------------------------------------
   Blog posts. The list on blog.html, the in-page detail view
   and the three cards on the homepage all come from here, so
   a post is written once and appears everywhere.

   YOU DO NOT NEED TO EDIT THIS FILE BY HAND.
   Open  admin.html  →  "Blog"  and press Publish.

   FIELDS
     id         unique slug, used in the page link
     title      headline
     category   small tag, e.g. "Kitchen"
     date       ISO yyyy-mm-dd — the site formats it for display
                and sorts newest first
     excerpt    one line shown on the cards
     img        photo path, or "" for no photo
     body       an array of paragraphs. Plain text only — it is
                inserted as text, never as HTML, so nothing a
                manager types can break the page.
     published  false = saved as a draft, invisible to guests
   ========================================================= */
window.SW_CONTENT = window.SW_CONTENT || {};

window.SW_CONTENT.blog = {
  /* How many posts show on the homepage "Recent Updates" row */
  homepageCount: 3,

  posts: [
    {
      id: "patte-kode-mornings",
      title: "Patte Kòde, Fresh Every Morning",
      category: "Bakery",
      date: "2026-08-10",
      excerpt: "Why the patties come out of the oven before the doors open — and why they go fast.",
      img: "",
      published: true,
      body: [
        "The bakery side of the kitchen starts long before the grill. Dough is mixed, rolled and folded around meat or aransò while the rest of University Boulevard is still quiet.",
        "We bake in batches through the morning rather than all at once. It costs us more work, but it means the patty you pick up at eleven is as good as the one that came out at seven.",
        "If you want a box of twelve for an office or a family gathering, call ahead. Weekends we sell out."
      ]
    },
    {
      id: "what-goes-into-griot",
      title: "What Goes Into Our Griot",
      category: "Kitchen",
      date: "2026-07-28",
      excerpt: "Marinate, braise, then fry. There is no shortcut, and we have stopped looking for one.",
      img: "assets/gallery/gallery-11.jpeg",
      published: true,
      body: [
        "Griot is three steps and a lot of waiting. The pork sits overnight in sour orange, garlic, thyme and scotch bonnet. Then it braises slowly until it gives way. Only then does it meet hot oil.",
        "Fry it too early and it is tough. Braise it too long and it falls apart in the pan. The window is narrow, which is why we cook it in small batches through the day instead of holding it under a lamp.",
        "It comes to the table with rice and beans, banana pesé and pikliz on the side. The pikliz is not optional."
      ]
    },
    {
      id: "special-menu-night",
      title: "Special Menu Night: Fish, Kabrit and Full Tables",
      category: "Events",
      date: "2026-07-14",
      excerpt: "The night the whole fish and the goat come out. Reserve, because the kitchen cooks to what it can get.",
      img: "assets/gallery/gallery-09.jpeg",
      published: true,
      body: [
        "Special Menu Night exists because some dishes cannot be cooked to order all week. Whole fish and kabrit depend on what arrives that morning, so we cook them when they are worth cooking.",
        "Fish platters come in four sizes, from small to XL — the XL is meant for a table to share. Kabrit is served as a platter or as a side.",
        "Numbers are limited by what came in. Book a table or call and we will tell you honestly what is left."
      ]
    },
    {
      id: "diri-kole",
      title: "Diri Kole — Rice and Beans, Done Properly",
      category: "Recipes",
      date: "2026-06-30",
      excerpt: "The plate everything else sits on. Get it wrong and nothing above it can save the dish.",
      img: "",
      published: true,
      body: [
        "Diri kole is the quiet test of a Haitian kitchen. The beans have to be cooked through but still whole, the rice separate, and the whole thing carrying coconut and thyme without shouting about it.",
        "We cook the beans first and use their liquid for the rice. That is the entire trick — the colour and the flavour come from the pot, not from anything added at the end.",
        "It is on the menu as a side, and under almost every platter we serve."
      ]
    },
    {
      id: "bouillon-kabrit-sunday",
      title: "Bouillon Kabrit, for a Slow Sunday",
      category: "Kitchen",
      date: "2026-06-12",
      excerpt: "Goat soup with root vegetables and dumplings — the dish people order when they need feeding, not impressing.",
      img: "",
      published: true,
      body: [
        "Bouillon is not a starter. It is a full bowl of goat, malanga, yam, plantain and dumplings, and it takes most of a morning to build.",
        "The goat goes in early and stays in. Vegetables join in order of how long they need, so nothing turns to mush waiting for something else.",
        "Sundays we close earlier. This is the dish to come in for before we do."
      ]
    },
    {
      id: "ordering-for-a-crowd",
      title: "How to Order for a Party of Twelve",
      category: "Guide",
      date: "2026-05-24",
      excerpt: "Platters, sides and how much to actually order — from people who watch it happen every weekend.",
      img: "assets/gallery/gallery-05.jpeg",
      published: true,
      body: [
        "The most common mistake is ordering twelve individual plates. Platters and sides feed a group better and cost less.",
        "For twelve people we would suggest two or three platters — griot, turkey and legume covers most tastes — plus rice and beans, banana pesé and a large salad. Add a box of pate fête to start.",
        "Give us a day's notice for anything over ten people, and two days for Special Menu Night. Use the order page or call and we will work it out with you."
      ]
    }
  ]
};
