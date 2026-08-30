/* =========================================================
   SEVEN WONDERS — js/menu-data.js  (compatibility shim)
   ---------------------------------------------------------
   The menu used to be typed into this file by hand. It now
   lives in  content/menu.js  so the dashboard can edit it.

   This file stays only to keep `window.SW_MENU` working for
   js/menu-render.js and the Menu-of-the-Day code in main.js.
   Sold-out dishes are filtered out here, in one place, so a
   dish marked sold out in the dashboard disappears from the
   menu, the order builder and the daily special at once.

   DO NOT ADD DISHES HERE — they will be ignored.
   Edit them in the dashboard, or in content/menu.js.
   ========================================================= */
(function () {
  "use strict";

  var SW = window.SW;
  if (!SW || !SW.menu) {
    // content/menu.js or js/content.js failed to load — fail loudly in the
    // console but leave a valid empty shape so nothing throws downstream.
    console.error("[Seven Wonders] Menu content missing. Check that content/menu.js and js/content.js are loaded before this file.");
    window.SW_MENU = { info: {}, categories: [], drinks: [], desserts: [] };
    return;
  }

  var menu = SW.menu;
  var settings = SW.settings || {};
  var contact = settings.contact || {};

  function available(list) {
    return (list || []).filter(function (it) { return !it.soldOut; });
  }

  window.SW_MENU = {
    /* Kept for anything that read SW_MENU.info; the real source
       of truth for these is content/settings.js */
    info: {
      name: (settings.brand || {}).legalName || "Seven Wonders",
      address: [contact.address1, contact.address2].filter(Boolean).join(", "),
      phone: contact.phone || ""
    },

    /* Full structure, minus sold-out dishes. Empty sub-categories
       and categories are dropped so the menu never renders an
       empty tab. */
    categories: (menu.categories || []).map(function (cat) {
      return {
        id: cat.id,
        label: cat.label,
        photo: cat.photo,
        subcats: (cat.subcats || []).map(function (sub) {
          return { id: sub.id, label: sub.label, items: available(sub.items) };
        }).filter(function (sub) { return sub.items.length > 0; })
      };
    }).filter(function (cat) { return cat.subcats.length > 0; }),

    drinks: available(menu.drinks),
    desserts: available(menu.desserts),

    /* Used by the Menu-of-the-Day picker in main.js */
    dailySpecial: menu.dailySpecial || { mode: "auto", itemId: null, discountPercent: 15 },
    featuredIds: menu.featuredIds || []
  };
})();
