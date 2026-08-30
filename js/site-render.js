/* =========================================================
   SEVEN WONDERS — js/site-render.js
   ---------------------------------------------------------
   Paints the parts of the site that used to be typed into the
   HTML by hand, using window.SW (see js/content.js).

   Covers: every page's header brand + footer, the contact page,
   the shop grid, the blog, and all of the homepage.

   Must load BEFORE js/main.js — main.js binds behaviour
   (lightbox, blog open/close, sliders) to the markup this file
   creates, and both run on DOMContentLoaded in script order.

   Manager-entered text is always written with textContent, never
   innerHTML, so nothing typed in the dashboard can inject markup
   into the live site. The only innerHTML used is for our own
   constant SVG icons below.
   ========================================================= */
(function () {
  "use strict";

  var SW = window.SW;
  if (!SW) {
    console.error("[Seven Wonders] js/content.js must load before js/site-render.js");
    return;
  }

  /* -----------------------------------------------------
     Tiny DOM builder
  ----------------------------------------------------- */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "text") { el.textContent = v; return; }
        if (k === "svg") { el.innerHTML = v; return; }   // our own constants only
        if (k === "class") { el.className = v; return; }
        if (k === "style") { el.setAttribute("style", v); return; }
        el.setAttribute(k, v === true ? "" : String(v));
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid == null || kid === false) return;
      el.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return el;
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function fill(node, kids) {
    if (!node) return;
    node.innerHTML = "";
    kids.forEach(function (k) { if (k) node.appendChild(k); });
  }

  var CART_SVG =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>' +
    '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';

  var FORK_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 3v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3"/><path d="M6 11v10"/>' +
    '<path d="M18 3c-1.5 0-3 1.8-3 5s1.5 4 3 4"/><path d="M18 12v9"/></svg>';

  var SOCIAL_ICONS = {
    instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
    facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
    twitter: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h3l-7 8 8 12h-6l-5-7-6 7H2l8-9L2 2h6l4 6z"/></svg>'
  };
  var SOCIAL_LABELS = { instagram: "Instagram", facebook: "Facebook", twitter: "X / Twitter" };

  /* Photo, or the fork placeholder when no photo is set */
  function photoOrPlaceholder(src, alt, cls) {
    if (src) return h("img", { src: src, alt: alt || "", loading: "lazy" });
    return h("span", { class: (cls || "") + " menu-item__thumb--ph", "aria-hidden": "true", svg: FORK_SVG });
  }

  function stripePaymentLink(url) {
    var clean = String(url || "").trim();
    return /^https:\/\/buy\.stripe\.com\//i.test(clean) ? clean : "";
  }

  /* =====================================================
     BRAND — header and footer logos, on every page
     ===================================================== */
  function renderBrand() {
    var b = SW.settings.brand || {};
    $$(".brand").forEach(function (node) {
      fill(node, [document.createTextNode(b.first || ""), h("span", { text: b.second || "" })]);
    });
  }

  /* =====================================================
     FOOTER — on every page
     ===================================================== */
  function renderFooter() {
    var grid = $(".site-footer .footer-grid");
    if (!grid) return;

    var s = SW.settings;
    var c = s.contact || {};
    var b = s.brand || {};

    /* --- brand column --- */
    var socials = [];
    Object.keys(SOCIAL_ICONS).forEach(function (key) {
      var url = (s.socials || {})[key];
      if (!url) return;   // no link → no dead "#" icon
      socials.push(h("a", {
        href: url, target: "_blank", rel: "noopener",
        "aria-label": SOCIAL_LABELS[key], svg: SOCIAL_ICONS[key]
      }));
    });

    var brandCol = h("div", { class: "footer-brand" }, [
      h("a", { class: "brand", href: "index.html" }, [
        document.createTextNode(b.first || ""), h("span", { text: b.second || "" })
      ]),
      h("p", { text: s.blurb || "" }),
      socials.length ? h("div", { class: "socials" }, socials) : null
    ]);

    /* --- visit column --- */
    var visitItems = [];
    if (c.address1) visitItems.push(h("li", { text: c.address1 }));
    if (c.address2) visitItems.push(h("li", { text: c.address2 }));
    if (c.phone) visitItems.push(h("li", {}, [h("a", { href: SW.telHref(), text: c.phone })]));
    if (c.email) visitItems.push(h("li", {}, [h("a", { href: "mailto:" + c.email, text: c.email })]));

    var visitCol = h("div", {}, [h("h4", { text: "Visit" }), h("ul", {}, visitItems)]);

    /* --- hours column: consecutive days with the same hours are
           collapsed into one line, e.g. "Mon – Thu · 8 AM – 9 PM" --- */
    var hoursItems = SW.hoursGrouped().map(function (row) {
      return h("li", { text: row.label + " · " + row.value });
    });
    if (s.hoursNote) hoursItems.push(h("li", { class: "footer-note", text: s.hoursNote }));
    var hoursCol = h("div", {}, [h("h4", { text: "Hours" }), h("ul", {}, hoursItems)]);

    /* --- explore column: site navigation, not editable content --- */
    var exploreCol = h("div", {}, [
      h("h4", { text: "Explore" }),
      h("ul", {}, [
        h("li", {}, [h("a", { href: "about.html", text: "About" })]),
        h("li", {}, [h("a", { href: "menu.html", text: "Menu" })]),
        h("li", {}, [h("a", { href: "reservation.html", text: "Reservations" })]),
        h("li", {}, [h("a", { href: "shop.html", text: "Shop" })]),
        h("li", {}, [h("a", { href: "blog.html", text: "Blog" })]),
        h("li", {}, [h("a", { href: "contact.html", text: "Contact" })])
      ])
    ]);

    fill(grid, [brandCol, visitCol, hoursCol, exploreCol]);

    /* --- bottom line --- */
    var bottom = $(".site-footer .footer-bottom");
    if (bottom) {
      var city = (c.address2 || "").split(",")[0] || "";
      fill(bottom, [
        document.createTextNode("© " + new Date().getFullYear() + " " +
          (b.legalName || b.shortName || "") + (city ? " · " + city : "") + " · ")
      ]);
      bottom.appendChild(h("a", { href: "reservation.html", text: "Book a table" }));
    }
  }

  /* =====================================================
     FORMS — put the real Web3Forms key into every form, and
     be honest with guests when there isn't one.
     ===================================================== */
  function renderForms() {
    var key = ((SW.settings.forms || {}).web3formsKey) || "";
    var live = SW.formsLive();
    var legal = (SW.settings.brand || {}).legalName || "Seven Wonders";

    $$("form[data-web3form]").forEach(function (form) {
      var input = form.querySelector('[name="access_key"]');
      if (input) input.value = key;
      var from = form.querySelector('[name="from_name"]');
      if (from) from.value = legal + " Website";

      if (live) return;

      /* No key configured: say so up front rather than showing a
         fake "Thank you!" after the guest has already left. */
      var status = form.querySelector(".form-status");
      if (status && !status.dataset.swOffline) {
        status.dataset.swOffline = "1";
        status.className = "form-status show warn";
        var phone = (SW.settings.contact || {}).phone;
        status.textContent = "Online booking is not switched on yet." +
          (phone ? " Please call " + phone + " and we'll take your details." : "");
      }
    });
  }

  /* =====================================================
     CONTACT PAGE
     ===================================================== */
  function renderContact() {
    var list = $(".contact-info");
    if (!list) return;

    var c = SW.settings.contact || {};
    function row(label, valueNode) {
      return h("li", {}, [
        h("span", { class: "ico", text: "✦" }),
        h("span", {}, [h("b", { text: label }), valueNode])
      ]);
    }
    var rows = [];
    var addr = [c.address1, c.address2].filter(Boolean).join(", ");
    if (addr) rows.push(row("Address", h("span", { text: addr })));
    if (c.phone) rows.push(row("Phone", h("span", {}, [h("a", { href: SW.telHref(), text: c.phone })])));
    if (c.email) rows.push(row("Email", h("span", {}, [h("a", { href: "mailto:" + c.email, text: c.email })])));

    var hoursText = SW.hoursGrouped().map(function (r) { return r.label + " " + r.value; }).join(" · ");
    if (hoursText) rows.push(row("Hours", h("span", { text: hoursText })));
    fill(list, rows);

    /* Map follows the address instead of being pinned to whatever
       street was hardcoded in the HTML. */
    var frame = $(".map-embed iframe");
    if (frame) {
      var q = c.mapQuery || addr;
      if (q) {
        frame.src = "https://www.google.com/maps?q=" + encodeURIComponent(q) + "&output=embed";
        frame.title = "Map of " + ((SW.settings.brand || {}).legalName || "the restaurant");
      }
    }
  }

  /* =====================================================
     SHOP PAGE
     ===================================================== */
  function renderShop() {
    var grid = $(".product-grid");
    if (!grid) return;

    var shop = SW.shop;
    var products = (shop.products || []).slice();

    /* sort dropdown, built from content so it can't offer an
       option the code doesn't implement */
    var select = $("#sort");
    if (select) {
      fill(select, (shop.sortOptions || []).map(function (o) { return h("option", { text: o }); }));
      select.addEventListener("change", paint);
    }

    function sorted() {
      var mode = select ? select.value : "";
      var list = products.slice();
      var eff = function (p) { return typeof p.sale === "number" ? p.sale : p.price; };
      if (/low to high/i.test(mode)) list.sort(function (a, b) { return eff(a) - eff(b); });
      else if (/high to low/i.test(mode)) list.sort(function (a, b) { return eff(b) - eff(a); });
      else if (/by name/i.test(mode)) list.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
      return list;
    }

    function card(p) {
      var onSale = typeof p.sale === "number" && p.sale < p.price;
      var priceRow = onSale
        ? h("div", { class: "price-row" }, [
            h("span", { class: "price-old", text: SW.money(p.price) }),
            h("span", { class: "price-new", text: SW.money(p.sale) })
          ])
        : h("div", { class: "price-row" }, [
            h("span", { class: "price-new", text: SW.money(p.price) })
          ]);

      var paymentLink = stripePaymentLink(p.paymentLink);
      var button = p.inStock === false
        ? h("button", { class: "btn btn--ghost btn--block", type: "button", disabled: true, text: "Sold out" })
        : paymentLink
          ? h("a", { class: "btn btn--primary btn--block", href: paymentLink, "data-payment-link": "", rel: "noopener" },
              [h("span", { svg: CART_SVG }), document.createTextNode(" Pay with Stripe")])
          : h("button", { class: "btn btn--primary btn--block", type: "button", "data-add-to-cart": "" },
              [h("span", { svg: CART_SVG }), document.createTextNode(" Add to cart")]);

      return h("article", { class: "product-card reveal" + (p.inStock === false ? " is-sold-out" : "") }, [
        onSale ? h("span", { class: "sale-badge", text: "Sale!" }) : null,
        p.inStock === false ? h("span", { class: "sale-badge sale-badge--out", text: "Sold out" }) : null,
        h("div", { class: "product-card__media" }, [photoOrPlaceholder(p.img, p.name, "product-card__ph")]),
        h("h3", { text: p.name }),
        p.note ? h("p", { class: "product-note", text: p.note }) : null,
        h("div", { class: "divider" }),
        priceRow,
        button
      ]);
    }

    function paint() {
      var list = sorted();
      fill(grid, list.map(card));
      var results = $(".shop-bar .results");
      if (results) {
        results.textContent = list.length === 0
          ? "No products available right now."
          : "Showing " + list.length + (list.length === 1 ? " product" : " products");
      }
      $$(".reveal", grid).forEach(function (el) { el.classList.add("in"); });
    }

    paint();
  }

  /* =====================================================
     BLOG PAGE  (list + in-page detail views)
     ===================================================== */
  function publishedPosts() {
    return (SW.blog.posts || [])
      .filter(function (p) { return p && p.published !== false; })
      .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  }

  function postCard(p) {
    return h("article", { class: "post-card reveal" }, [
      h("div", { class: "post-card__media" }, [photoOrPlaceholder(p.img, p.title, "post-card__ph")]),
      h("div", { class: "post-meta" }, [
        h("span", { class: "cat", text: p.category || "" }),
        h("span", { class: "date", text: SW.formatDate(p.date) })
      ]),
      h("h3", {}, [h("a", { href: "#", "data-post": p.id, text: p.title })]),
      h("p", { text: p.excerpt || "" }),
      h("a", { class: "read-more", href: "#", "data-post": p.id, text: "Read More →" })
    ]);
  }

  function renderBlogPage() {
    var listWrap = $("#blog-list .blog-grid");
    var detail = $("#blog-detail");
    if (!listWrap || !detail) return;

    var posts = publishedPosts();

    if (!posts.length) {
      fill(listWrap, [h("p", { class: "empty-note", text: "No posts yet." })]);
      return;
    }

    fill(listWrap, posts.map(postCard));

    var back = h("a", { href: "#", class: "back-link", text: "← Back to all posts" });
    var articles = posts.map(function (p, i) {
      return h("article", { class: "post-full" + (i === 0 ? " active" : ""), id: "post-" + p.id }, [
        h("div", { class: "post-meta" }, [
          h("span", { class: "cat", text: p.category || "" }),
          h("span", { class: "date", text: SW.formatDate(p.date) })
        ]),
        h("h2", { text: p.title }),
        p.img ? h("img", { src: p.img, alt: p.title }) : null
      ].concat((p.body || []).map(function (para) { return h("p", { text: para }); })));
    });
    fill(detail, [back].concat(articles));

    /* Arriving from a homepage card (blog.html#post-…) should open
       that post, not dump the reader at the top of the list. */
    var wanted = String(window.location.hash || "").replace(/^#/, "");
    if (/^post-/.test(wanted) && $("#" + wanted, detail)) {
      $$(".post-full", detail).forEach(function (a) {
        a.classList.toggle("active", a.id === wanted);
      });
      $("#blog-list").style.display = "none";
      detail.style.display = "block";
    }
  }

  /* =====================================================
     HOMEPAGE
     ===================================================== */
  function renderHomeHero() {
    var hero = $(".hero");
    if (!hero) return;
    var d = SW.home.hero || {};

    var bg = $(".hero__bg", hero);
    if (bg && d.image) { bg.src = d.image; bg.alt = d.imageAlt || ""; }

    var eyebrow = $(".hero__inner .eyebrow", hero);
    if (eyebrow && d.eyebrow) eyebrow.textContent = d.eyebrow;

    var title = $(".hero__inner h1", hero);
    if (title && d.title) {
      /* "{accent}" is replaced by an apricot <span> */
      var parts = String(d.title).split("{accent}");
      var kids = [document.createTextNode(parts[0] || "")];
      if (parts.length > 1) {
        kids.push(h("span", { class: "accent", text: d.accent || "" }));
        kids.push(document.createTextNode(parts.slice(1).join("{accent}")));
      }
      fill(title, kids);
    }

    var lead = $(".hero__inner h1 + p", hero);
    if (lead && d.lead) lead.textContent = d.lead;

    var ctas = $$(".hero__cta a", hero);
    if (ctas[0] && d.primaryCta) { ctas[0].textContent = d.primaryCta.label; ctas[0].href = d.primaryCta.href; }
    if (ctas[1] && d.secondaryCta) { ctas[1].textContent = d.secondaryCta.label; ctas[1].href = d.secondaryCta.href; }
  }

  function renderHomeAbout() {
    var grid = $(".about-grid");
    if (!grid) return;
    var d = SW.home.about || {};

    var eyebrow = $(".eyebrow", grid);
    if (eyebrow && d.eyebrow) eyebrow.textContent = d.eyebrow;
    var title = $(".section-title", grid);
    if (title && d.title) title.textContent = d.title;
    var body = $(".section-title + p", grid);
    if (body && d.body) body.textContent = d.body;

    var img = $("img", grid);
    if (img && d.image) { img.src = d.image; img.alt = d.imageAlt || ""; }

    var row = $(".stat-row", grid);
    if (row) {
      var stats = d.stats || [];
      if (!stats.length) row.remove();
      else fill(row, stats.map(function (s) {
        return h("div", { class: "stat" }, [h("b", { text: s.value }), h("span", { text: s.label })]);
      }));
    }
  }

  function renderFeatured() {
    var grid = $(".dish-grid");
    if (!grid) return;

    var ids = SW.menu.featuredIds || [];
    var cards = [];
    ids.forEach(function (id) {
      var hit = SW.findMenuItem(id);
      if (!hit || hit.item.soldOut) return;      // never feature a sold-out dish
      var it = hit.item;
      cards.push(h("article", { class: "dish-card reveal" }, [
        photoOrPlaceholder(it.img || hit.cat.photo, it.name, "dish-card__ph"),
        h("div", { class: "dish-card__body" }, [
          h("h3", { text: it.name }),
          h("span", { class: "price", text: typeof it.price === "number" ? SW.money(it.price) : (it.priceLabel || "") }),
          h("p", { text: it.desc || hit.sub.label + " · " + hit.cat.label })
        ])
      ]));
    });

    var section = grid.closest(".section");
    if (!cards.length) { if (section) section.hidden = true; return; }
    fill(grid, cards);
  }

  function renderEvents() {
    var grid = $(".events-grid");
    if (!grid) return;
    var section = grid.closest(".section");
    var d = SW.home.events || {};

    var today = SW.todayMidnight();
    var upcoming = (d.items || []).filter(function (e) {
      var when = SW.parseDate(e.date);
      return when && when >= today;
    }).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }).slice(0, 6);

    /* Nothing coming up → hide the section rather than advertise
       nights that have already been and gone. */
    if (!upcoming.length) { if (section) section.hidden = true; return; }
    if (section) section.hidden = false;

    var head = section ? $(".center", section) : null;
    if (head) {
      var eb = $(".eyebrow", head), tt = $(".section-title", head), ld = $(".section-lead", head);
      if (eb && d.eyebrow) eb.textContent = d.eyebrow;
      if (tt && d.title) tt.textContent = d.title;
      if (ld && d.lead) ld.textContent = d.lead;
    }

    fill(grid, upcoming.map(function (e) {
      return h("article", { class: "event-card reveal" }, [
        photoOrPlaceholder(e.img, e.title, "event-card__ph"),
        h("div", { class: "event-card__body" }, [
          h("span", { class: "event-when", text: SW.formatEventDate(e.date, e.time) }),
          h("h3", { text: e.title }),
          e.genre ? h("p", { class: "event-genre", text: e.genre }) : null,
          h("a", { class: "btn btn--primary", href: "reservation.html", text: "Reserve this night" })
        ])
      ]);
    }));
  }

  function renderHomeGallery() {
    var grid = $("#gallery");
    if (!grid) return;

    var all = (SW.gallery.images || []).filter(function (p) { return p && p.src && !p.hidden; });
    var byPath = {};
    all.forEach(function (p) { byPath[p.src] = p; });

    var picks = (SW.gallery.homepage || [])
      .map(function (src) { return byPath[src]; })
      .filter(Boolean);
    if (!picks.length) picks = all.slice(0, 7);

    /* The two "wide" and one "tall" tiles are what give the mosaic
       its shape — keep them on the same positions as before. */
    var SHAPE = { 0: "wide", 1: "tall", 5: "wide" };

    fill(grid, picks.map(function (p, i) {
      return h("button", { type: "button", class: SHAPE[i] || null, "data-full": p.src }, [
        h("img", { src: p.src, alt: p.alt || "Seven Wonders gallery photo", loading: "lazy" })
      ]);
    }));
  }

  function renderTestimonials() {
    var slider = $("#slider");
    if (!slider) return;
    var section = slider.closest(".section");
    var d = SW.home.testimonials || {};
    var items = d.items || [];

    if (!items.length) { if (section) section.hidden = true; return; }
    if (section) section.hidden = false;

    var track = $(".slider__track", slider);
    if (!track) return;

    fill(track, items.map(function (t, i) {
      var rating = Math.max(0, Math.min(5, Number(t.stars) || 5));
      var initials = String(t.name || "")
        .split(/\s+/).filter(Boolean).slice(0, 2)
        .map(function (w) { return w.charAt(0).toUpperCase(); }).join("");
      return h("div", { class: "slide" + (i === 0 ? " active" : "") }, [
        h("div", { class: "stars", "aria-label": rating + " out of 5 stars", text: "★★★★★".slice(0, rating) }),
        h("blockquote", { text: "“" + (t.quote || "") + "”" }),
        h("div", { class: "who" }, [
          t.avatar
            ? h("img", { src: t.avatar, alt: "" })
            : h("span", { class: "who__initials", "aria-hidden": "true", text: initials || "★" }),
          h("b", { text: t.name || "" }),
          t.context ? h("span", { text: t.context }) : null
        ])
      ]);
    }));
  }

  function renderBlogPreview() {
    var grid = $(".blog-grid");
    if (!grid || $("#blog-list")) return;   // blog.html handles its own grid
    var section = grid.closest(".section");
    var d = SW.home.blogPreview || {};

    if (section) {
      var eb = $(".eyebrow", section), tt = $(".section-title", section), ld = $(".section-lead", section);
      if (eb && d.eyebrow) eb.textContent = d.eyebrow;
      if (tt && d.title) tt.textContent = d.title;
      if (ld && d.lead) ld.textContent = d.lead;
    }

    var count = SW.blog.homepageCount || 3;
    var posts = publishedPosts().slice(0, count);
    if (!posts.length) { if (section) section.hidden = true; return; }

    /* On the homepage the card links jump to blog.html rather than
       opening an in-page detail view that doesn't exist here. */
    fill(grid, posts.map(function (p) {
      return h("article", { class: "post-card reveal" }, [
        h("div", { class: "post-card__media" }, [photoOrPlaceholder(p.img, p.title, "post-card__ph")]),
        h("div", { class: "post-meta" }, [
          h("span", { class: "cat", text: p.category || "" }),
          h("span", { class: "date", text: SW.formatDate(p.date) })
        ]),
        h("h3", {}, [h("a", { href: "blog.html#post-" + p.id, text: p.title })]),
        h("p", { text: p.excerpt || "" }),
        h("a", { class: "read-more", href: "blog.html#post-" + p.id, text: "Read More →" })
      ]);
    }));
  }

  function renderCtaBanner() {
    var banner = $(".cta-banner");
    if (!banner) return;
    var d = SW.home.ctaBanner || {};
    var img = $("img", banner);
    if (img && d.image) { img.src = d.image; img.alt = ""; }
    var eb = $(".eyebrow", banner), tt = $("h2", banner), p = $("h2 + p", banner), a = $("a.btn", banner);
    if (eb && d.eyebrow) eb.textContent = d.eyebrow;
    if (tt && d.title) tt.textContent = d.title;
    if (p && d.lead) p.textContent = d.lead;
    if (a && d.cta) { a.textContent = d.cta.label; a.href = d.cta.href; }
  }

  function renderMenuOfDayChrome() {
    var mod = $("#mod");
    if (!mod) return;
    var d = SW.home.menuOfDay || {};
    var badge = $(".mod-today", mod);
    if (badge && d.badge) badge.textContent = d.badge;
    var cta = $(".mod-body a.btn", mod);
    if (cta && d.ctaLabel) { cta.textContent = d.ctaLabel; if (d.ctaHref) cta.href = d.ctaHref; }
  }

  /* =====================================================
     ABOUT PAGE
     Nothing on this page is written into about.html any more.
     The story, the founder cards and the photo stack all come
     from content/about.js; the address and phone in the closing
     block come from content/settings.js, so they cannot drift
     out of step with the footer.
     ===================================================== */
  function paragraphs(list) {
    return (list || []).filter(Boolean).map(function (text) {
      return h("p", { text: text });
    });
  }

  function renderAbout() {
    var page = $("[data-about-page]");
    if (!page) return;                 // not the About page
    var a = SW.about || {};

    /* --- hero --- */
    var hero = $("[data-about-hero]", page);
    if (hero) {
      var d = a.hero || {};
      var heroImg = $("img", hero);
      if (heroImg && d.image) { heroImg.src = d.image; heroImg.alt = d.imageAlt || ""; }
      var heroEyebrow = $(".eyebrow", hero);
      if (heroEyebrow && d.eyebrow) heroEyebrow.textContent = d.eyebrow;
      var heroTitle = $("h1", hero);
      if (heroTitle && d.title) heroTitle.textContent = d.title;
    }

    /* --- intro story --- */
    var intro = $("[data-about-intro]", page);
    if (intro) {
      var i = a.intro || {};
      var kids = [];
      if (i.eyebrow) kids.push(h("p", { class: "eyebrow", text: i.eyebrow }));
      if (i.title) kids.push(h("h2", { class: "section-title", text: i.title }));
      kids = kids.concat(paragraphs(i.body));
      fill(intro, kids);
    }

    /* --- founder cards: no people, no empty column --- */
    var founders = $("[data-about-founders]", page);
    if (founders) {
      var f = a.founders || {};
      var people = (f.people || []).filter(function (p) { return p && p.name; });
      if (!people.length) founders.remove();
      else {
        if (f.label) founders.setAttribute("aria-label", f.label);
        fill(founders, people.map(function (p) {
          return h("article", { class: "founder-card" }, [
            photoOrPlaceholder(p.photo, p.photoAlt || p.name, ""),
            h("div", {}, [
              h("h3", { text: p.name }),
              p.role ? h("p", { text: p.role }) : null
            ])
          ]);
        }));
      }
    }

    /* --- photo stack + the rest of the story --- */
    var stack = $("[data-about-photos]", page);
    if (stack) {
      var photos = ((a.detail || {}).photos || []).filter(function (p) { return p && p.src; });
      if (!photos.length) stack.remove();
      else fill(stack, photos.map(function (p) {
        return h("img", { src: p.src, alt: p.alt || "", loading: "lazy" });
      }));
    }

    var detail = $("[data-about-detail]", page);
    if (detail) {
      var dt = a.detail || {};
      var body = paragraphs(dt.body);
      if (dt.closing) body.push(h("p", {}, [h("strong", { text: dt.closing })]));
      fill(detail, body);
    }

    /* --- closing "visit us" block: address and phone from settings --- */
    var visit = $("[data-about-visit]", page);
    if (visit) {
      var v = a.visit || {};
      var c = SW.settings.contact || {};
      var kids2 = [];
      if (v.eyebrow) kids2.push(h("p", { class: "eyebrow", text: v.eyebrow }));
      if (v.title) kids2.push(h("h2", { class: "section-title", text: v.title }));

      var addr = [];
      if (c.address1) addr.push(document.createTextNode(c.address1));
      if (c.address1 && c.address2) addr.push(h("br", {}));
      if (c.address2) addr.push(document.createTextNode(c.address2));
      if (addr.length) kids2.push(h("p", {}, addr));
      if (c.phone) kids2.push(h("p", {}, [h("a", { href: SW.telHref(), text: c.phone })]));

      var ctas = [];
      [[v.primaryCta, "btn btn--primary"], [v.secondaryCta, "btn btn--ghost"]]
        .forEach(function (pair) {
          var cta = pair[0];
          if (cta && cta.label && cta.href) {
            ctas.push(h("a", { class: pair[1], href: cta.href, text: cta.label }));
          }
        });
      if (ctas.length) kids2.push(h("div", { class: "hero__cta" }, ctas));

      fill(visit, kids2);
    }
  }

  /* =====================================================
     RUN
     ===================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    renderBrand();
    renderFooter();
    renderForms();
    renderContact();
    renderShop();
    renderBlogPage();
    renderAbout();

    renderHomeHero();
    renderHomeAbout();
    renderMenuOfDayChrome();
    renderFeatured();
    renderEvents();
    renderHomeGallery();
    renderTestimonials();
    renderBlogPreview();
    renderCtaBanner();
  });
})();
