/* =========================================================
   SEVEN WONDERS — js/content.js
   ---------------------------------------------------------
   Turns the plain data files in content/ into one object the
   rest of the site reads: window.SW.

   Load order on every page:
     content/*.js   →   js/content.js   →   everything else

   THREE THINGS THIS FILE DOES

   1. Never lets a missing or broken content file take the site
      down. Each section falls back to a safe empty default, so
      a typo in one file cannot white-screen the whole page.

   2. Draft preview. The dashboard saves unpublished edits to
      localStorage. Those are layered on top of the published
      content ONLY in preview mode — opened with ?preview=1, or
      from the dashboard's Preview button. A normal visitor is
      never shown an unpublished draft, even on the same browser.

   3. Small shared helpers (money, dates, opening hours) so the
      renderers and the dashboard format things identically.
   ========================================================= */
(function () {
  "use strict";

  var SECTIONS = ["settings", "menu", "shop", "gallery", "blog", "home", "about"];

  var DRAFT_KEY = "sw_admin_draft_v1";
  var PREVIEW_FLAG = "sw_preview_on";

  /* -----------------------------------------------------
     Safe defaults — the shape every renderer can rely on
  ----------------------------------------------------- */
  var DEFAULTS = {
    settings: {
      brand: { first: "Seven", second: "Wonders", legalName: "Seven Wonders", shortName: "Seven Wonders" },
      tagline: "",
      blurb: "",
      contact: { address1: "", address2: "", phone: "", phoneDigits: "", email: "", mapQuery: "" },
      hours: [],
      hoursNote: "",
      socials: { instagram: "", facebook: "", twitter: "" },
      forms: { web3formsKey: "", fallbackNote: "Please call us to confirm." },
      verified: {}
    },
    menu: {
      dailySpecial: { mode: "auto", itemId: null, discountPercent: 15 },
      featuredIds: [],
      categories: [],
      drinks: [],
      desserts: []
    },
    shop: { sortOptions: ["Default sorting"], products: [] },
    gallery: { homepage: [], images: [] },
    blog: { homepageCount: 3, posts: [] },
    home: {
      hero: {}, about: { stats: [] }, events: { items: [] }, gallery: {},
      testimonials: { items: [] }, blogPreview: {}, ctaBanner: {}, menuOfDay: {}
    },
    about: {
      hero: {}, intro: { body: [] }, founders: { people: [] },
      detail: { photos: [], body: [], closing: "" }, visit: {}
    }
  };

  /* -----------------------------------------------------
     Merge helpers
     Objects merge key by key; arrays are replaced whole,
     because a draft always carries the complete list (that is
     how deletions and reordering survive a merge).
  ----------------------------------------------------- */
  function isPlainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }
  function merge(base, over) {
    if (!isPlainObject(over)) return over === undefined ? base : over;
    var out = {};
    var k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    for (k in over) {
      if (!Object.prototype.hasOwnProperty.call(over, k)) continue;
      out[k] = isPlainObject(base[k]) && isPlainObject(over[k]) ? merge(base[k], over[k]) : over[k];
    }
    return out;
  }
  function clone(v) {
    try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; }
  }

  /* -----------------------------------------------------
     Preview mode
     ?preview=1 turns it on for this tab and remembers it while
     the tab lives, so clicking through the site keeps the draft
     visible. ?preview=0 turns it off again.
  ----------------------------------------------------- */
  function resolvePreview() {
    var on = false;
    try {
      var q = String(window.location.search || "");
      if (/[?&]preview=1/.test(q)) { sessionStorage.setItem(PREVIEW_FLAG, "1"); on = true; }
      else if (/[?&]preview=0/.test(q)) { sessionStorage.removeItem(PREVIEW_FLAG); on = false; }
      else on = sessionStorage.getItem(PREVIEW_FLAG) === "1";
    } catch (e) { on = false; }
    return on;
  }

  function readDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return isPlainObject(parsed) ? parsed : null;
    } catch (e) {
      return null; // a corrupt draft must never break the live site
    }
  }

  /* -----------------------------------------------------
     Build window.SW
  ----------------------------------------------------- */
  var published = window.SW_CONTENT || {};
  var isPreview = resolvePreview();
  var draft = isPreview ? readDraft() : null;

  var SW = {
    isPreview: isPreview,
    hasDraft: !!draft,
    DRAFT_KEY: DRAFT_KEY,
    /* The published content, untouched — the dashboard diffs against this */
    published: {}
  };

  SECTIONS.forEach(function (name) {
    var base = merge(DEFAULTS[name], published[name] || {});
    SW.published[name] = clone(base);
    SW[name] = draft && draft[name] ? merge(base, draft[name]) : base;
  });

  function normalizeShopProducts(shop) {
    (shop.products || []).forEach(function (product) {
      if (typeof product.paymentLink !== "string") product.paymentLink = "";
    });
  }
  normalizeShopProducts(SW.shop || {});
  normalizeShopProducts(SW.published.shop || {});

  /* -----------------------------------------------------
     Shared formatting helpers
  ----------------------------------------------------- */
  SW.money = function (n) {
    var num = typeof n === "number" && isFinite(n) ? n : 0;
    return "$" + num.toFixed(2);
  };

  SW.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  SW.telHref = function () {
    var c = SW.settings.contact || {};
    var digits = c.phoneDigits || String(c.phone || "").replace(/[^\d+]/g, "");
    return digits ? "tel:" + digits : "";
  };

  var MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  /* "2026-08-10" → "August 10, 2026". Parsed as local, not UTC,
     so a date never shifts a day backwards in western timezones. */
  SW.parseDate = function (iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").trim());
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  };
  SW.formatDate = function (iso) {
    var d = SW.parseDate(iso);
    if (!d) return String(iso || "");
    return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  };
  SW.formatEventDate = function (iso, time) {
    var d = SW.parseDate(iso);
    if (!d) return String(iso || "");
    var out = DAY_ABBR[(d.getDay() + 6) % 7] + " · " +
      MONTHS[d.getMonth()].slice(0, 3) + " " + d.getDate();
    return time ? out + " · " + time : out;
  };
  SW.todayMidnight = function () {
    var t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  };

  /* "8:00 AM" → "8 AM" so the footer stays compact */
  function shortTime(t) {
    return String(t || "").replace(/:00\s*/, " ").replace(/\s+/g, " ").trim();
  }

  /* Collapses the seven days into ranges that share the same
     hours: [{ label:"Mon – Thu", value:"8 AM – 9 PM" }, …] */
  SW.hoursGrouped = function () {
    var hours = Array.isArray(SW.settings.hours) ? SW.settings.hours : [];
    var out = [];
    var i = 0;
    while (i < hours.length) {
      var h = hours[i] || {};
      var key = h.closed ? "closed" : shortTime(h.open) + "|" + shortTime(h.close);
      var j = i;
      while (j + 1 < hours.length) {
        var n = hours[j + 1] || {};
        var nkey = n.closed ? "closed" : shortTime(n.open) + "|" + shortTime(n.close);
        if (nkey !== key) break;
        j++;
      }
      var from = (hours[i].day || DAY_ABBR[i] || "").slice(0, 3);
      var to = (hours[j].day || DAY_ABBR[j] || "").slice(0, 3);
      out.push({
        label: i === j ? from : from + " – " + to,
        value: h.closed ? "Closed" : shortTime(h.open) + " – " + shortTime(h.close)
      });
      i = j + 1;
    }
    return out;
  };

  /* Day numbers (0=Sun … 6=Sat) the restaurant is closed —
     the reservation calendar disables these. */
  SW.closedWeekdays = function () {
    var out = [];
    (SW.settings.hours || []).forEach(function (h, i) {
      if (h && h.closed) out.push((i + 1) % 7);
    });
    return out;
  };

  /* Is the site able to actually deliver form submissions? */
  SW.formsLive = function () {
    var k = (SW.settings.forms || {}).web3formsKey || "";
    return !!k && k.indexOf("PLACEHOLDER") === -1;
  };

  /* ---- Menu lookups shared by the site and the dashboard ---- */
  SW.eachMenuItem = function (fn) {
    (SW.menu.categories || []).forEach(function (cat) {
      (cat.subcats || []).forEach(function (sub) {
        (sub.items || []).forEach(function (it) { fn(it, sub, cat); });
      });
    });
  };
  SW.findMenuItem = function (id) {
    var found = null;
    SW.eachMenuItem(function (it, sub, cat) {
      if (it.id === id) found = { item: it, sub: sub, cat: cat };
    });
    return found;
  };

  window.SW = SW;

  /* A quiet banner so nobody mistakes a draft for the live site */
  if (isPreview) {
    document.addEventListener("DOMContentLoaded", function () {
      var bar = document.createElement("div");
      bar.className = "sw-preview-bar";
      bar.setAttribute("role", "status");
      bar.innerHTML =
        '<span><b>Draft preview</b> — ' +
        (draft ? "showing unpublished changes." : "no unpublished changes right now.") +
        "</span>" +
        '<a href="admin.html">Back to dashboard</a>' +
        '<a href="?preview=0">Exit preview</a>';
      document.body.appendChild(bar);
      document.body.classList.add("has-preview-bar");
    });
  }
})();
