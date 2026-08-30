/* =========================================================
   SEVEN WONDERS — js/admin/app.js
   ---------------------------------------------------------
   The manager's dashboard.

   HOW IT WORKS, IN THREE SENTENCES
   1. It loads the same content/*.js files the website loads, and
      keeps an editable copy — the draft — in this browser.
   2. Every keystroke saves the draft, so nothing is lost if the
      tab closes; Preview opens the real website reading that
      draft, visible only to this browser.
   3. Publish turns the changed sections back into content/*.js
      files and commits them (see js/admin/store.js), which is
      what makes the change public.

   Nothing here talks to the live site directly. Publishing is
   always a deliberate, separate step.
   ========================================================= */
(function () {
  "use strict";

  var SW = window.SW;
  var Store = window.SWStore;
  if (!SW || !Store) {
    document.body.textContent = "Dashboard failed to load: content or store script missing.";
    return;
  }

  var Draft = Store.Draft;
  var Meta = Store.Meta;
  var Serializer = Store.Serializer;
  var clone = Store.clone;

  /* =====================================================
     DOM helpers
     ===================================================== */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") { el.textContent = v; return; }
      if (k === "class") { el.className = v; return; }
      if (k === "html") { el.innerHTML = v; return; }
      if (k.slice(0, 2) === "on" && typeof v === "function") { el.addEventListener(k.slice(2), v); return; }
      el.setAttribute(k, v === true ? "" : String(v));
    });
    (kids || []).forEach(function (kid) {
      if (kid == null || kid === false) return;
      el.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return el;
  }
  function $(sel) { return document.querySelector(sel); }
  function fill(node, kids) {
    node.innerHTML = "";
    (kids || []).forEach(function (k) { if (k) node.appendChild(k); });
  }
  function slug(text, taken) {
    var base = String(text || "item").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // "Kòde" → "kode"
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
    var id = base, n = 2;
    while (taken.indexOf(id) !== -1) { id = base + "-" + n; n++; }
    return id;
  }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* =====================================================
     STATE
     ===================================================== */
  var published = SW.published;
  var draft = Draft.read();
  if (!draft) draft = {};
  Store.SECTIONS.forEach(function (s) {
    if (!draft[s]) draft[s] = clone(published[s]);
  });

  var state = { view: "overview" };

  function changed() { return Draft.changedSections(draft, published); }

  /* Save the draft and refresh the chrome. Called after every edit. */
  function touch(rerender) {
    Draft.write(draft);
    paintNav();
    if (rerender) render();
  }

  /* =====================================================
     REUSABLE FIELDS
     Each one edits obj[key] in place and saves on input.
     ===================================================== */
  function field(label, control, hint) {
    return h("div", { class: "field" }, [
      label ? h("label", { text: label }) : null,
      control,
      hint ? h("span", { class: "note", text: hint }) : null
    ]);
  }

  function textField(label, obj, key, opts) {
    opts = opts || {};
    var input = h(opts.multiline ? "textarea" : "input", {
      type: opts.multiline ? null : (opts.type || "text"),
      value: opts.multiline ? null : (obj[key] == null ? "" : obj[key]),
      placeholder: opts.placeholder || "",
      oninput: function (e) { obj[key] = e.target.value; touch(); }
    });
    if (opts.multiline) input.value = obj[key] == null ? "" : obj[key];
    return field(label, input, opts.hint);
  }

  /* Money field. Empty means "price varies" — stored as null, which is
     how the printed menu handles Spaghetti and Fritay. */
  function priceField(label, obj, key, opts) {
    opts = opts || {};
    var input = h("input", {
      type: "text",
      inputmode: "decimal",
      value: typeof obj[key] === "number" ? obj[key].toFixed(2) : "",
      placeholder: opts.placeholder || "0.00",
      oninput: function (e) {
        var raw = e.target.value.replace(/[^0-9.]/g, "");
        obj[key] = raw === "" ? null : (isNaN(parseFloat(raw)) ? null : parseFloat(raw));
        touch();
      }
    });
    return field(label, input, opts.hint);
  }

  function numberField(label, obj, key, opts) {
    opts = opts || {};
    var input = h("input", {
      type: "number",
      min: opts.min == null ? null : opts.min,
      max: opts.max == null ? null : opts.max,
      value: obj[key] == null ? "" : obj[key],
      oninput: function (e) {
        var v = parseFloat(e.target.value);
        obj[key] = isNaN(v) ? null : v;
        touch();
      }
    });
    return field(label, input, opts.hint);
  }

  function checkField(label, obj, key, opts) {
    opts = opts || {};
    var input = h("input", {
      type: "checkbox",
      checked: !!obj[key],
      onchange: function (e) { obj[key] = e.target.checked; touch(!!opts.rerender); }
    });
    return h("label", { class: "check" }, [input, h("span", { text: label })]);
  }

  function selectField(label, obj, key, options, opts) {
    opts = opts || {};
    var sel = h("select", {
      onchange: function (e) {
        obj[key] = e.target.value === "\u0000" ? null : e.target.value;
        touch(!!opts.rerender);
      }
    }, options.map(function (o) {
      var value = o.value == null ? "\u0000" : String(o.value);
      var current = obj[key] == null ? "\u0000" : String(obj[key]);
      return h("option", { value: value, selected: value === current, text: o.label });
    }));
    return field(label, sel, opts.hint);
  }

  /* Paragraph editor: one blank line between paragraphs, stored as an
     array of plain strings (never HTML). */
  function paragraphsField(label, obj, key, hint) {
    var area = h("textarea", {
      rows: 8,
      oninput: function (e) {
        obj[key] = e.target.value.split(/\n\s*\n/).map(function (s) { return s.trim(); })
          .filter(function (s) { return s.length; });
        touch();
      }
    });
    area.value = (obj[key] || []).join("\n\n");
    return field(label, area, hint || "Leave a blank line between paragraphs.");
  }

  function photoField(label, obj, key, hint) {
    var btn = h("button", { class: "thumb-btn", type: "button" });
    function paint() {
      fill(btn, [
        obj[key]
          ? h("img", { src: obj[key], alt: "" })
          : h("span", { class: "ph", text: "none" }),
        h("span", { class: "name", text: obj[key] ? obj[key].split("/").pop() : "Choose a photo…" })
      ]);
    }
    btn.addEventListener("click", function () {
      openPhotoPicker(obj[key], function (src) { obj[key] = src; paint(); touch(); });
    });
    paint();
    return field(label, btn, hint);
  }

  function tools(list, index, opts) {
    opts = opts || {};
    return h("div", { class: "row__tools" }, [
      h("button", {
        class: "btn btn--sm btn--icon", type: "button", title: "Move up",
        disabled: index === 0,
        onclick: function () { var it = list.splice(index, 1)[0]; list.splice(index - 1, 0, it); touch(true); }
      }, ["↑"]),
      h("button", {
        class: "btn btn--sm btn--icon", type: "button", title: "Move down",
        disabled: index === list.length - 1,
        onclick: function () { var it = list.splice(index, 1)[0]; list.splice(index + 1, 0, it); touch(true); }
      }, ["↓"]),
      h("button", {
        class: "btn btn--sm btn--icon btn--danger", type: "button", title: "Delete",
        onclick: function () {
          if (!confirm(opts.confirm || "Delete this item? This cannot be undone once published.")) return;
          list.splice(index, 1);
          touch(true);
        }
      }, ["✕"])
    ]);
  }

  function card(title, kids, hint, headExtra) {
    return h("div", { class: "card" }, [
      title ? h("div", { class: "card__head" }, [
        h("h2", { text: title }), h("span", { class: "grow" })
      ].concat(headExtra || [])) : null,
      hint ? h("p", { class: "card__hint", text: hint }) : null
    ].concat(kids));
  }

  /* =====================================================
     PHOTO PICKER MODAL
     ===================================================== */
  var pickerCb = null;
  function openPhotoPicker(current, cb) {
    pickerCb = cb;
    var grid = $("#photo-grid");
    var photos = (draft.gallery.images || []);
    fill(grid, [
      h("button", {
        class: "none" + (current ? "" : " sel"), type: "button", title: "No photo",
        onclick: function () { choose(""); }
      }, ["No photo"])
    ].concat(photos.map(function (p) {
      return h("button", {
        type: "button", class: p.src === current ? "sel" : null, title: p.src,
        onclick: function () { choose(p.src); }
      }, [h("img", { src: p.src, alt: p.alt || "", loading: "lazy" })]);
    })));
    $("#photo-modal").classList.add("open");
  }
  function choose(src) {
    $("#photo-modal").classList.remove("open");
    if (pickerCb) pickerCb(src);
    pickerCb = null;
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close-modal]") || e.target.id === "photo-modal") {
      $("#photo-modal").classList.remove("open");
      pickerCb = null;
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { $("#photo-modal").classList.remove("open"); pickerCb = null; }
  });

  /* =====================================================
     Counting helpers used by the nav and the overview
     ===================================================== */
  function menuStats() {
    var total = 0, soldOut = 0;
    (draft.menu.categories || []).forEach(function (c) {
      (c.subcats || []).forEach(function (s) {
        (s.items || []).forEach(function (i) { total++; if (i.soldOut) soldOut++; });
      });
    });
    (draft.menu.drinks || []).forEach(function (d) { total++; if (d.soldOut) soldOut++; });
    (draft.menu.desserts || []).forEach(function (d) { total++; if (d.soldOut) soldOut++; });
    return { total: total, soldOut: soldOut };
  }
  function allMenuItems() {
    var out = [];
    (draft.menu.categories || []).forEach(function (c) {
      (c.subcats || []).forEach(function (s) {
        (s.items || []).forEach(function (i) {
          out.push({ id: i.id, label: i.name + " — " + c.label + " / " + s.label, item: i });
        });
      });
    });
    return out;
  }
  function upcomingEvents() {
    var today = todayIso();
    return (draft.home.events.items || []).filter(function (e) { return String(e.date) >= today; });
  }
  function unverified() {
    var v = draft.settings.verified || {};
    var labels = {
      name: "Restaurant name", address: "Street address", phone: "Phone number",
      email: "Email address", hours: "Opening hours", socials: "Social media links"
    };
    return Object.keys(labels).filter(function (k) { return !v[k]; })
      .map(function (k) { return { key: k, label: labels[k] }; });
  }

  /* =====================================================
     NAV
     ===================================================== */
  var VIEWS = [
    { id: "overview", label: "Overview", count: function () { return ""; } },
    { id: "menu", label: "Menu & prices", count: function () { return menuStats().total; } },
    { id: "shop", label: "Shop", count: function () { return (draft.shop.products || []).length; } },
    { id: "gallery", label: "Gallery", count: function () { return (draft.gallery.images || []).length; } },
    { id: "blog", label: "Blog", count: function () { return (draft.blog.posts || []).length; } },
    { id: "home", label: "Homepage", count: function () { return ""; } },
    { id: "about", label: "About page", count: function () { return ""; } },
    { id: "info", label: "Info & hours", count: function () { return ""; } },
    { id: "publish", label: "Publish", count: function () { var n = changed().length; return n ? n : ""; } },
    { id: "settings", label: "Settings", count: function () { return ""; } }
  ];

  function paintNav() {
    fill($("#nav"), VIEWS.map(function (v) {
      return h("button", {
        class: "side__link" + (state.view === v.id ? " active" : ""),
        type: "button",
        onclick: function () { state.view = v.id; render(); paintNav(); window.scrollTo(0, 0); }
      }, [
        h("span", { text: v.label }),
        h("span", { class: "count", text: String(v.count()) })
      ]);
    }));

    var meta = Meta.read();
    $("#last-published").textContent = meta.lastPublished
      ? "Last published " + meta.lastPublished
      : "Nothing published from here yet.";
  }

  /* Sticky bar with the unsaved-changes indicator, Preview and Publish */
  function actionbar() {
    var n = changed().length;
    return h("div", { class: "actionbar" }, [
      h("span", { class: "dirty-pill" + (n ? " is-dirty" : "") }, [
        h("span", { class: "dot" }),
        h("span", { text: n ? n + (n === 1 ? " section changed" : " sections changed") + " — not published yet" : "Everything is published" })
      ]),
      h("span", { class: "actionbar__spacer" }),
      h("a", {
        class: "btn", href: "index.html?preview=1", target: "_blank", rel: "noopener",
        title: "Opens the website in a new tab showing your unpublished changes"
      }, ["Preview site ↗"]),
      h("button", {
        class: "btn btn--primary", type: "button", disabled: !n,
        onclick: function () { state.view = "publish"; render(); paintNav(); }
      }, [n ? "Publish " + n + " change" + (n === 1 ? "" : "s") : "Nothing to publish"])
    ]);
  }

  function pageHead(title, blurb) {
    return h("div", { class: "page-head" }, [
      h("h1", { text: title }),
      blurb ? h("p", { text: blurb }) : null
    ]);
  }

  /* =====================================================
     VIEW — OVERVIEW
     ===================================================== */
  function viewOverview() {
    var stats = menuStats();
    var todo = unverified();
    var formsLive = !!((draft.settings.forms || {}).web3formsKey || "").trim();
    var gh = Store.get("github");

    var notices = [];

    if (!formsLive) {
      notices.push(h("div", { class: "notice notice--bad" }, [
        h("span", { class: "notice__ico", text: "!" }),
        h("div", {}, [
          h("b", { text: "Reservations and orders are not reaching you." }),
          h("p", { text: "No form key is set, so the reservation form, the contact form and online ordering cannot send anything. " +
            "Guests are told to call instead of being shown a confirmation. Add a free Web3Forms key to switch them on." }),
          h("button", {
            class: "btn btn--sm", type: "button",
            onclick: function () { state.view = "info"; render(); paintNav(); }
          }, ["Set the form key →"])
        ])
      ]));
    }

    if (!gh.isConfigured()) {
      notices.push(h("div", { class: "notice notice--warn" }, [
        h("span", { class: "notice__ico", text: "·" }),
        h("div", {}, [
          h("b", { text: "Publishing is not connected yet." }),
          h("p", { text: "You can edit and preview everything now, but to make changes public this dashboard needs a GitHub token — or you can download the files and upload them yourself." }),
          h("button", {
            class: "btn btn--sm", type: "button",
            onclick: function () { state.view = "settings"; render(); paintNav(); }
          }, ["Set up publishing →"])
        ])
      ]));
    }

    /* Just published? The deploy takes about a minute, and this page is
       still reading the old files. Say so, so a manager who reloads and
       sees the old text does not think the change was lost. */
    var meta = Meta.read();
    if (meta.lastPublishedAt && Date.now() - meta.lastPublishedAt < 5 * 60 * 1000) {
      notices.push(h("div", { class: "notice notice--good" }, [
        h("span", { class: "notice__ico", text: "✓" }),
        h("div", {}, [
          h("b", { text: "Published at " + meta.lastPublished + "." }),
          h("p", { text: "The website is rebuilding — this normally takes under a minute. " +
            "If you reload this page and still see the old text, the rebuild has not finished yet. " +
            "Wait a moment and reload again; nothing has been lost." })
        ])
      ]));
    }

    notices.push(h("div", { class: "notice" }, [
      h("span", { class: "notice__ico", text: "i" }),
      h("div", {}, [
        h("b", { text: "Anyone who knows this address can open this page." }),
        h("p", { text: "The site is hosted as plain files, so there is no real login to put in front of it. " +
          "What protects the website is the publish token, which is stored only in this browser — without it, this page can change nothing. " +
          "You can add a PIN in Settings to hide the screen, and ADMIN.md explains how to lock it properly if you want that." })
      ])
    ]));

    var tiles = h("div", { class: "tiles" }, [
      h("div", { class: "tile" }, [h("b", { text: String(stats.total) }), h("span", { text: "menu items & drinks" })]),
      h("div", { class: "tile" + (stats.soldOut ? " is-alert" : "") }, [h("b", { text: String(stats.soldOut) }), h("span", { text: "marked sold out" })]),
      h("div", { class: "tile" }, [h("b", { text: String((draft.shop.products || []).length) }), h("span", { text: "shop products" })]),
      h("div", { class: "tile" }, [h("b", { text: String((draft.gallery.images || []).length) }), h("span", { text: "gallery photos" })]),
      h("div", { class: "tile" }, [h("b", { text: String((draft.blog.posts || []).filter(function (p) { return p.published !== false; }).length) }), h("span", { text: "published posts" })]),
      h("div", { class: "tile" }, [h("b", { text: String(upcomingEvents().length) }), h("span", { text: "upcoming events" })])
    ]);

    var checklist = card("Details to confirm", [
      todo.length
        ? h("ul", { class: "checklist" }, todo.map(function (t) {
            return h("li", {}, [
              h("span", { class: "mark no", text: "!" }),
              h("span", { class: "grow", text: t.label }),
              h("button", {
                class: "btn btn--sm", type: "button",
                onclick: function () { state.view = "info"; render(); paintNav(); }
              }, ["Check it"])
            ]);
          }))
        : h("p", { class: "card__hint", style: "margin:0", text: "All confirmed. Nothing on the site is a guess." })
    ], todo.length
      ? "These values were carried over or guessed when the site was built. Open Info & hours, correct anything wrong, then tick it off."
      : null);

    return [
      pageHead("Overview", "Everything on the website that you can change yourself."),
      actionbar(),
      h("div", {}, notices),
      tiles,
      checklist,
      card("What you can change here", [
        h("ul", { style: "margin:0;padding-left:1.2rem;color:var(--muted);line-height:1.9" }, [
          h("li", { html: "<b style='color:var(--body)'>Menu & prices</b> — dishes, prices, sold-out, the daily special, the three dishes shown on the homepage" }),
          h("li", { html: "<b style='color:var(--body)'>Shop</b> — what is for sale, prices, sale prices, in stock or not" }),
          h("li", { html: "<b style='color:var(--body)'>Gallery</b> — order, descriptions, which photos are on the homepage" }),
          h("li", { html: "<b style='color:var(--body)'>Blog</b> — write, edit, publish or unpublish posts" }),
          h("li", { html: "<b style='color:var(--body)'>Homepage</b> — headline, story, events, guest reviews" }),
          h("li", { html: "<b style='color:var(--body)'>About page</b> — your founding story, the founders, photos of the restaurant" }),
          h("li", { html: "<b style='color:var(--body)'>Info & hours</b> — address, phone, opening hours, social links, form key" })
        ])
      ])
    ];
  }

  /* =====================================================
     VIEW — MENU
     ===================================================== */
  function dishRow(list, item, index) {
    return h("div", { class: "row row--dish" + (item.soldOut ? " is-off" : "") }, [
      h("div", { class: "grid" }, [
        textField("Dish name", item, "name", { placeholder: "Griot Pork Platter" }),
        textField("Small note under the name", item, "desc", { placeholder: "Meat or Aransò" })
      ]),
      h("div", { class: "grid" }, [
        photoField("Photo", item, "img"),
        textField("Badge", item, "badge", { placeholder: "e.g. New" })
      ]),
      h("div", { class: "grid" }, [
        priceField("Price", item, "price", { hint: "Blank = price varies" }),
        typeof item.price !== "number"
          ? textField("Shown instead", item, "priceLabel", { placeholder: "Variable" })
          : null,
        checkField("Sold out", item, "soldOut", { rerender: true })
      ]),
      tools(list, index, { confirm: "Delete “" + (item.name || "this dish") + "”?" })
    ]);
  }

  function viewMenu() {
    var items = allMenuItems();
    var itemOptions = items.map(function (i) { return { value: i.id, label: i.label }; });
    var special = draft.menu.dailySpecial;

    var specialCard = card("Menu of the Day", [
      h("div", { class: "grid grid--3" }, [
        selectField("How it is chosen", special, "mode", [
          { value: "auto", label: "Automatic — a different dish each day" },
          { value: "manual", label: "Always show one dish I pick" }
        ], { rerender: true }),
        special.mode === "manual"
          ? selectField("Dish", special, "itemId", [{ value: null, label: "Choose a dish…" }].concat(itemOptions))
          : null,
        numberField("Discount %", special, "discountPercent", { min: 0, max: 90, hint: "0 = no discount shown" })
      ])
    ], "Automatic picks one main dish per day from Lunch, Dinner and Special Menu Night. Every visitor sees the same dish, and it changes by itself at midnight.");

    var featuredCard = card("Featured on the homepage", [
      h("div", { class: "grid grid--3" }, [0, 1, 2].map(function (i) {
        var holder = {
          get id() { return (draft.menu.featuredIds || [])[i] || null; },
          set id(v) {
            draft.menu.featuredIds = draft.menu.featuredIds || [];
            draft.menu.featuredIds[i] = v;
          }
        };
        return selectField("Dish " + (i + 1), holder, "id",
          [{ value: null, label: "None" }].concat(itemOptions));
      }))
    ], "Names, prices and photos come from the menu below, so you only ever change a price in one place.");

    var cats = (draft.menu.categories || []).map(function (cat, ci) {
      var body = [];
      body.push(h("div", { class: "grid grid--2" }, [
        textField("Category name", cat, "label"),
        photoField("Category photo", cat, "photo", "Used when a dish has no photo of its own")
      ]));

      (cat.subcats || []).forEach(function (sub, si) {
        body.push(h("div", { class: "subhead" }, [
          h("h4", { text: sub.label || "Untitled group" }),
          h("span", { class: "grow" }),
          h("button", {
            class: "btn btn--sm", type: "button",
            onclick: function () {
              var name = prompt("Rename this group", sub.label || "");
              if (name != null) { sub.label = name; touch(true); }
            }
          }, ["Rename"]),
          h("button", {
            class: "btn btn--sm", type: "button",
            onclick: function () {
              sub.items = sub.items || [];
              var name = prompt("Name of the new dish");
              if (!name) return;
              sub.items.push({
                id: slug(name, allMenuItems().map(function (i) { return i.id; })),
                name: name, desc: "", price: null, soldOut: false
              });
              touch(true);
            }
          }, ["+ Dish"]),
          h("button", {
            class: "btn btn--sm btn--danger", type: "button",
            onclick: function () {
              if (!confirm("Delete the group “" + sub.label + "” and all " + (sub.items || []).length + " dishes in it?")) return;
              cat.subcats.splice(si, 1);
              touch(true);
            }
          }, ["Delete group"])
        ]));

        if (!(sub.items || []).length) {
          body.push(h("p", { class: "card__hint", text: "No dishes in this group yet." }));
        }
        (sub.items || []).forEach(function (item, ii) {
          body.push(dishRow(sub.items, item, ii));
        });
      });

      return card(cat.label || "Category", body, null, [
        h("button", {
          class: "btn btn--sm", type: "button",
          onclick: function () {
            var name = prompt("Name of the new group (e.g. Soups)");
            if (!name) return;
            cat.subcats = cat.subcats || [];
            cat.subcats.push({
              id: slug(cat.id + "-" + name, (cat.subcats || []).map(function (s) { return s.id; })),
              label: name, items: []
            });
            touch(true);
          }
        }, ["+ Group"]),
        h("button", {
          class: "btn btn--sm btn--icon", type: "button", title: "Move category up", disabled: ci === 0,
          onclick: function () {
            var it = draft.menu.categories.splice(ci, 1)[0];
            draft.menu.categories.splice(ci - 1, 0, it);
            touch(true);
          }
        }, ["↑"]),
        h("button", {
          class: "btn btn--sm btn--icon", type: "button", title: "Move category down",
          disabled: ci === draft.menu.categories.length - 1,
          onclick: function () {
            var it = draft.menu.categories.splice(ci, 1)[0];
            draft.menu.categories.splice(ci + 1, 0, it);
            touch(true);
          }
        }, ["↓"]),
        h("button", {
          class: "btn btn--sm btn--danger", type: "button",
          onclick: function () {
            if (!confirm("Delete the whole “" + cat.label + "” menu and everything in it?")) return;
            draft.menu.categories.splice(ci, 1);
            touch(true);
          }
        }, ["Delete"])
      ]);
    });

    function addonList(title, key, hint) {
      var list = draft.menu[key] || (draft.menu[key] = []);
      return card(title, [
        list.length ? null : h("p", { class: "card__hint", text: "Nothing here yet." })
      ].concat(list.map(function (it, i) {
        return h("div", { class: "row row--dish" + (it.soldOut ? " is-off" : "") }, [
          textField("Name", it, "name"),
          h("span"),
          h("div", { class: "grid" }, [
            priceField("Price", it, "price"),
            checkField("Sold out", it, "soldOut", { rerender: true })
          ]),
          tools(list, i, { confirm: "Delete “" + (it.name || "this") + "”?" })
        ]);
      })), hint, [
        h("button", {
          class: "btn btn--sm", type: "button",
          onclick: function () {
            var name = prompt("Name");
            if (!name) return;
            list.push({ id: slug(name, list.map(function (x) { return x.id; })), name: name, price: 0, soldOut: false });
            touch(true);
          }
        }, ["+ Add"])
      ]);
    }

    return [
      pageHead("Menu & prices", "The menu, the drinks list, the daily special and the dishes shown on the homepage. Sold-out dishes disappear from the menu, the order form and the homepage until you switch them back on."),
      actionbar(),
      specialCard,
      featuredCard
    ].concat(cats).concat([
      h("div", { style: "margin:1.4rem 0" }, [
        h("button", {
          class: "btn", type: "button",
          onclick: function () {
            var name = prompt("Name of the new menu (e.g. Weekend Brunch)");
            if (!name) return;
            draft.menu.categories.push({
              id: slug(name, (draft.menu.categories || []).map(function (c) { return c.id; })),
              label: name, photo: "", subcats: []
            });
            touch(true);
          }
        }, ["+ Add a whole new menu section"])
      ]),
      addonList("Drinks", "drinks", "Offered as add-ons on the online order form."),
      addonList("Desserts", "desserts", "There are none on the printed menu. Add one and the “Add a dessert” group appears on the order form by itself.")
    ]);
  }

  /* =====================================================
     VIEW — SHOP
     ===================================================== */
  function viewShop() {
    var list = draft.shop.products || (draft.shop.products = []);
    return [
      pageHead("Shop", "What appears on the Shop page. The “showing N products” line is counted from this list, so it can never be wrong."),
      actionbar(),
      card("Products", [
        list.length ? null : h("p", { class: "card__hint", text: "No products yet." })
      ].concat(list.map(function (p, i) {
        return h("div", { class: "row" + (p.inStock === false ? " is-off" : "") }, [
          h("div", { class: "grid grid--2" }, [
            textField("Name", p, "name"),
            textField("Small note", p, "note", { placeholder: "Meat or Aransò · fresh daily" })
          ]),
          h("div", { class: "grid grid--3" }, [
            priceField("Normal price", p, "price"),
            priceField("Sale price", p, "sale", { hint: "Blank = not on sale" }),
            photoField("Photo", p, "img")
          ]),
          textField("Stripe Payment Link", p, "paymentLink", {
            type: "url",
            placeholder: "https://buy.stripe.com/...",
            hint: "Optional. Leave blank to keep Add to cart. Paste Payment Links only, never Stripe secret keys."
          }),
          h("div", { class: "row__tools", style: "justify-content:space-between" }, [
            checkField("In stock", p, "inStock", { rerender: true }),
            tools(list, i, { confirm: "Delete “" + (p.name || "this product") + "”?" })
          ])
        ]);
      })), null, [
        h("button", {
          class: "btn btn--sm", type: "button",
          onclick: function () {
            var name = prompt("Product name");
            if (!name) return;
            list.push({
              id: slug(name, list.map(function (x) { return x.id; })),
              name: name, note: "", price: 0, sale: null, inStock: true, img: "", paymentLink: ""
            });
            touch(true);
          }
        }, ["+ Add product"])
      ])
    ];
  }

  /* =====================================================
     VIEW — GALLERY
     ===================================================== */
  function viewGallery() {
    var images = draft.gallery.images || (draft.gallery.images = []);
    var home = draft.gallery.homepage || (draft.gallery.homepage = []);

    var missingAlt = images.filter(function (p) { return !p.alt; }).length;

    return [
      pageHead("Gallery", "All " + images.length + " photos, in the order guests see them. The star marks the ones on the homepage."),
      actionbar(),

      missingAlt
        ? h("div", { class: "notice notice--warn" }, [
            h("span", { class: "notice__ico", text: "·" }),
            h("div", {}, [
              h("b", { text: missingAlt + " photos have no description." }),
              h("p", { text: "A description is what someone using a screen reader hears instead of the photo, and it helps the site show up in image search. A short phrase is enough: “Griot with rice and beans”." })
            ])
          ])
        : null,

      card("Add a photo", [
        h("p", { class: "card__hint", style: "margin-top:0" , text:
          "A web page cannot copy an image file into the project, so put the file in the site's assets/gallery/ folder first (alongside gallery-01.jpeg and the rest), then type its filename here." }),
        h("div", { style: "display:flex;gap:.6rem;flex-wrap:wrap;align-items:end" }, [
          h("div", { class: "field", style: "flex:1 1 260px" }, [
            h("label", { text: "Filename or path", for: "new-photo" }),
            h("input", { type: "text", id: "new-photo", placeholder: "gallery-54.jpeg" })
          ]),
          h("button", {
            class: "btn btn--primary", type: "button",
            onclick: function () {
              var input = $("#new-photo");
              var v = (input.value || "").trim();
              if (!v) return;
              var src = v.indexOf("/") === -1 ? "assets/gallery/" + v : v;
              if (images.some(function (p) { return p.src === src; })) {
                alert("That photo is already in the list.");
                return;
              }
              // Check it actually loads before adding it, so a typo is
              // caught here instead of showing a broken image to guests.
              var probe = new Image();
              probe.onload = function () {
                images.push({ src: src, alt: "", hidden: false });
                input.value = "";
                touch(true);
              };
              probe.onerror = function () {
                alert("Could not load \"" + src + "\".\n\nCheck the file is in assets/gallery/ and the name matches exactly, including .jpeg vs .jpg.");
              };
              probe.src = src;
            }
          }, ["Add photo"])
        ])
      ]),

      card("Photos", [
        h("div", { class: "gal-grid" }, images.map(function (p, i) {
          var onHome = home.indexOf(p.src) !== -1;
          return h("div", { class: "gal-item" + (p.hidden ? " is-off" : "") }, [
            h("img", { src: p.src, alt: "", loading: "lazy" }),
            h("div", { class: "gal-item__body" }, [
              h("span", { class: "path", text: p.src.split("/").pop() }),
              h("input", {
                type: "text", value: p.alt || "", placeholder: "Describe this photo…",
                oninput: function (e) { p.alt = e.target.value; touch(); }
              }),
              h("div", { class: "gal-item__tools" }, [
                h("button", {
                  class: "btn btn--sm btn--icon", type: "button",
                  title: onHome ? "Remove from the homepage" : "Show on the homepage",
                  onclick: function () {
                    if (onHome) home.splice(home.indexOf(p.src), 1);
                    else home.push(p.src);
                    touch(true);
                  }
                }, [onHome ? "★" : "☆"]),
                h("button", {
                  class: "btn btn--sm btn--icon", type: "button",
                  title: p.hidden ? "Show to guests" : "Hide from guests",
                  onclick: function () { p.hidden = !p.hidden; touch(true); }
                }, [p.hidden ? "🚫" : "👁"]),
                h("span", { class: "grow" }),
                tools(images, i, { confirm: "Remove this photo from the gallery? The file itself stays in assets/gallery/." })
              ]),
              onHome ? h("span", { class: "home-flag", text: "On the homepage" }) : null
            ])
          ]);
        }))
      ], home.length === 7 ? null : "The homepage mosaic is designed for exactly 7 photos — " + home.length + " are starred right now."),

      card("Homepage order", [
        home.length
          ? h("div", {}, home.map(function (src, i) {
              return h("div", { class: "row", style: "display:flex;align-items:center;gap:.6rem" }, [
                h("img", { src: src, alt: "", style: "width:64px;height:48px;object-fit:cover;border-radius:6px" }),
                h("span", { class: "grow", style: "flex:1 1 auto;font-size:.85rem", text: src.split("/").pop() }),
                tools(home, i, { confirm: "Remove this photo from the homepage? It stays in the gallery." })
              ]);
            }))
          : h("p", { class: "card__hint", style: "margin:0", text: "None starred — the homepage will fall back to the first seven photos." })
      ], "The first photo and the sixth are drawn wide, the second tall. That is what makes the mosaic look deliberate.")
    ];
  }

  /* =====================================================
     VIEW — BLOG
     ===================================================== */
  function viewBlog() {
    var posts = draft.blog.posts || (draft.blog.posts = []);
    return [
      pageHead("Blog", "Posts appear newest first, on the blog page and on the homepage. Unpublished posts are saved but invisible to guests."),
      actionbar(),
      card("Homepage", [
        numberField("How many posts to show on the homepage", draft.blog, "homepageCount", { min: 0, max: 6 })
      ]),
      h("div", { style: "margin-bottom:1rem" }, [
        h("button", {
          class: "btn btn--primary", type: "button",
          onclick: function () {
            var title = prompt("Post title");
            if (!title) return;
            posts.unshift({
              id: slug(title, posts.map(function (p) { return p.id; })),
              title: title, category: "Kitchen", date: todayIso(),
              excerpt: "", img: "", published: false, body: []
            });
            touch(true);
          }
        }, ["+ Write a new post"])
      ])
    ].concat(posts.map(function (p, i) {
      return card(p.title || "Untitled", [
        h("div", { class: "grid grid--2" }, [
          textField("Title", p, "title"),
          textField("Category tag", p, "category", { placeholder: "Kitchen" })
        ]),
        h("div", { class: "grid grid--3" }, [
          textField("Date", p, "date", { type: "date" }),
          photoField("Photo", p, "img")
        ]),
        textField("One-line summary shown on the cards", p, "excerpt", { multiline: true }),
        paragraphsField("The post", p, "body"),
        h("div", { class: "row__tools", style: "justify-content:space-between;margin-top:.6rem" }, [
          checkField("Published — guests can read this", p, "published", { rerender: true }),
          tools(posts, i, { confirm: "Delete “" + (p.title || "this post") + "”?" })
        ])
      ], p.published === false ? "Draft — not visible on the website." : null);
    }));
  }

  /* =====================================================
     VIEW — HOMEPAGE
     ===================================================== */
  function viewHome() {
    var home = draft.home;
    var events = home.events.items || (home.events.items = []);
    var quotes = home.testimonials.items || (home.testimonials.items = []);
    var stats = home.about.stats || (home.about.stats = []);

    return [
      pageHead("Homepage", "The words and pictures on the front page."),
      actionbar(),

      card("Top of the page", [
        h("div", { class: "grid grid--2" }, [
          textField("Small line above the headline", home.hero, "eyebrow"),
          photoField("Background photo", home.hero, "image")
        ]),
        textField("Headline", home.hero, "title", { hint: "Keep {accent} where you want the apricot words to go." }),
        textField("The apricot words", home.hero, "accent"),
        textField("Sentence under the headline", home.hero, "lead", { multiline: true })
      ]),

      card("Our story", [
        h("div", { class: "grid grid--2" }, [
          textField("Small line above", home.about, "eyebrow"),
          textField("Heading", home.about, "title")
        ]),
        textField("The paragraph", home.about, "body", { multiline: true }),
        photoField("Photo", home.about, "image"),
        h("div", { class: "subhead" }, [
          h("h4", { text: "The three highlights" }),
          h("span", { class: "grow" }),
          h("button", {
            class: "btn btn--sm", type: "button",
            onclick: function () { stats.push({ value: "", label: "" }); touch(true); }
          }, ["+ Add"])
        ]),
        stats.length ? null : h("p", { class: "card__hint", text: "None — the row is hidden on the website." })
      ].concat(stats.map(function (s, i) {
        return h("div", { class: "row", style: "display:grid;grid-template-columns:1fr 2fr auto;align-items:end;gap:.6rem" }, [
          textField("Big text", s, "value"),
          textField("Label underneath", s, "label"),
          tools(stats, i)
        ]);
      })), "Keep these honest — they are the first thing a guest reads."),

      card("Events & live music", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "Each event has a real date. Once it passes it disappears on its own, and when nothing is coming up the whole section hides itself — so the homepage can never advertise a night that has already been." }),
        h("div", { class: "grid grid--2" }, [
          textField("Small line above", home.events, "eyebrow"),
          textField("Heading", home.events, "title")
        ]),
        textField("Sentence underneath", home.events, "lead"),
        h("div", { class: "subhead" }, [
          h("h4", { text: upcomingEvents().length + " upcoming, " + events.length + " in total" }),
          h("span", { class: "grow" }),
          h("button", {
            class: "btn btn--sm", type: "button",
            onclick: function () {
              events.push({ title: "", date: todayIso(), time: "8 PM", genre: "", img: "" });
              touch(true);
            }
          }, ["+ Add event"])
        ])
      ].concat(events.map(function (e, i) {
        var past = String(e.date) < todayIso();
        return h("div", { class: "row" + (past ? " is-off" : "") }, [
          h("div", { class: "grid grid--2" }, [
            textField("Who is playing", e, "title"),
            textField("What kind of music", e, "genre", { placeholder: "Live Jazz" })
          ]),
          h("div", { class: "grid grid--3" }, [
            textField("Date", e, "date", { type: "date", hint: past ? "In the past — hidden from guests" : null }),
            textField("Time", e, "time", { placeholder: "8 PM" }),
            photoField("Photo", e, "img")
          ]),
          h("div", { class: "row__tools", style: "justify-content:flex-end" }, [tools(events, i)])
        ]);
      }))),

      card("Guest reviews", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "Only publish words a guest actually said. Leave the photo blank and the card shows their initials rather than a stock photo of a stranger. With no reviews the section is hidden." }),
        h("div", { class: "grid grid--2" }, [
          textField("Small line above", home.testimonials, "eyebrow"),
          textField("Heading", home.testimonials, "title")
        ]),
        h("div", { class: "subhead" }, [
          h("h4", { text: quotes.length + " review" + (quotes.length === 1 ? "" : "s") }),
          h("span", { class: "grow" }),
          h("button", {
            class: "btn btn--sm", type: "button",
            onclick: function () { quotes.push({ name: "", context: "", quote: "", stars: 5, avatar: "" }); touch(true); }
          }, ["+ Add review"])
        ])
      ].concat(quotes.map(function (q, i) {
        return h("div", { class: "row" }, [
          textField("What they said", q, "quote", { multiline: true }),
          h("div", { class: "grid grid--3" }, [
            textField("Their name", q, "name"),
            textField("Occasion", q, "context", { placeholder: "Sunday lunch" }),
            numberField("Stars", q, "stars", { min: 1, max: 5 })
          ]),
          h("div", { class: "row__tools", style: "justify-content:flex-end" }, [tools(quotes, i)])
        ]);
      }))),

      card("Section headings", [
        h("div", { class: "grid grid--2" }, [
          textField("Gallery heading", home.gallery, "title"),
          textField("Gallery sentence", home.gallery, "lead"),
          textField("Blog heading", home.blogPreview, "title"),
          textField("Blog sentence", home.blogPreview, "lead")
        ])
      ]),

      card("Closing banner", [
        h("div", { class: "grid grid--2" }, [
          textField("Small line above", home.ctaBanner, "eyebrow"),
          textField("Heading", home.ctaBanner, "title")
        ]),
        textField("Sentence", home.ctaBanner, "lead"),
        photoField("Background photo", home.ctaBanner, "image")
      ])
    ];
  }

  /* =====================================================
     VIEW — ABOUT PAGE
     ===================================================== */
  function viewAbout() {
    var about = draft.about;
    var people = about.founders.people || (about.founders.people = []);
    var photos = about.detail.photos || (about.detail.photos = []);

    return [
      pageHead("About page", "Your story, the founders, and the photos of the restaurant."),
      actionbar(),

      card("Top of the page", [
        h("div", { class: "grid grid--2" }, [
          textField("Small line above the headline", about.hero, "eyebrow"),
          photoField("Banner photo", about.hero, "image")
        ]),
        textField("Headline", about.hero, "title"),
        textField("Photo description", about.hero, "imageAlt", {
          hint: "What someone using a screen reader hears instead of the banner photo."
        })
      ]),

      card("Your story", [
        h("div", { class: "grid grid--2" }, [
          textField("Small line above", about.intro, "eyebrow"),
          textField("Heading", about.intro, "title")
        ]),
        paragraphsField("The story", about.intro, "body")
      ], "This is the first thing a guest reads about you. Leave a blank line between paragraphs."),

      card("The founders", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "Delete both cards and the whole block disappears rather than leaving an empty column beside your story." }),
        h("div", { class: "subhead" }, [
          h("h4", { text: people.length + (people.length === 1 ? " person" : " people") }),
          h("span", { class: "grow" }),
          h("button", {
            class: "btn btn--sm", type: "button",
            onclick: function () { people.push({ name: "", role: "", photo: "", photoAlt: "" }); touch(true); }
          }, ["+ Add a founder"])
        ])
      ].concat(people.map(function (person, i) {
        return h("div", { class: "row" }, [
          h("div", { class: "grid grid--3" }, [
            textField("Name", person, "name"),
            textField("Role", person, "role", { placeholder: "Founder" }),
            photoField("Portrait", person, "photo")
          ]),
          textField("Photo description", person, "photoAlt", {
            hint: "Heard instead of the portrait. “Oswald Gaboyau, co-founder” is plenty."
          }),
          h("div", { class: "row__tools", style: "justify-content:flex-end" }, [
            tools(people, i, { confirm: "Remove this founder card?" })
          ])
        ]);
      }))),

      card("Photos of the restaurant", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "The stack of photos beside the second half of your story. Remove them all and the story runs full width instead." }),
        h("div", { class: "subhead" }, [
          h("h4", { text: photos.length + " photo" + (photos.length === 1 ? "" : "s") }),
          h("span", { class: "grow" }),
          h("button", {
            class: "btn btn--sm", type: "button",
            onclick: function () { photos.push({ src: "", alt: "" }); touch(true); }
          }, ["+ Add a photo"])
        ])
      ].concat(photos.map(function (photo, i) {
        return h("div", { class: "row" }, [
          h("div", { class: "grid grid--2" }, [
            photoField("Photo", photo, "src"),
            textField("Description", photo, "alt")
          ]),
          h("div", { class: "row__tools", style: "justify-content:flex-end" }, [
            tools(photos, i, { confirm: "Remove this photo from the About page?" })
          ])
        ]);
      }))),

      card("The rest of the story", [
        paragraphsField("Continued", about.detail, "body"),
        textField("Closing line", about.detail, "closing", {
          multiline: true,
          hint: "Printed in bold under the paragraphs. Leave it empty to hide it."
        })
      ]),

      card("Visit us", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "The block at the bottom of the page. Your address and phone number are NOT typed here — they come from Info & hours, so they always match the footer." }),
        h("div", { class: "grid grid--2" }, [
          textField("Small line above", about.visit, "eyebrow"),
          textField("Heading", about.visit, "title")
        ]),
        h("div", { class: "grid grid--2" }, [
          textField("Main button", about.visit.primaryCta || (about.visit.primaryCta = {}), "label"),
          textField("Main button goes to", about.visit.primaryCta, "href", { placeholder: "reservation.html" })
        ]),
        h("div", { class: "grid grid--2" }, [
          textField("Second button", about.visit.secondaryCta || (about.visit.secondaryCta = {}), "label"),
          textField("Second button goes to", about.visit.secondaryCta, "href", { placeholder: "menu.html" })
        ])
      ])
    ];
  }

  /* =====================================================
     VIEW — INFO & HOURS
     ===================================================== */
  function viewInfo() {
    var s = draft.settings;
    var c = s.contact;
    var v = s.verified || (s.verified = {});
    var hours = s.hours || (s.hours = []);
    var keySet = !!String((s.forms || {}).web3formsKey || "").trim();

    return [
      pageHead("Info & hours", "Written here once, used on every page — footers, the contact page, the map and the reservation form."),
      actionbar(),

      card("Online forms", [
        keySet
          ? h("div", { class: "notice notice--good" }, [
              h("span", { class: "notice__ico", text: "✓" }),
              h("div", {}, [h("b", { text: "Forms are switched on." }),
                h("p", { text: "Reservations, contact messages and online orders are emailed to the address registered with your Web3Forms key." })])
            ])
          : h("div", { class: "notice notice--bad" }, [
              h("span", { class: "notice__ico", text: "!" }),
              h("div", {}, [h("b", { text: "Nothing is reaching you right now." }),
                h("p", { text: "Without a key the forms cannot send. Get a free one at web3forms.com — it asks for the email address that should receive the messages, then gives you an access key to paste below." })])
            ]),
        textField("Web3Forms access key", s.forms, "web3formsKey", {
          placeholder: "paste the key here",
          hint: "Safe to publish — this key can only send email to the address you registered."
        }),
        h("p", { style: "margin:.6rem 0 0" }, [h("a", { href: "https://web3forms.com", target: "_blank", rel: "noopener", text: "Get a free key at web3forms.com ↗" })])
      ]),

      card("The restaurant", [
        h("div", { class: "grid grid--3" }, [
          textField("Logo — first word", s.brand, "first"),
          textField("Logo — apricot word", s.brand, "second"),
          textField("Full name", s.brand, "legalName")
        ]),
        textField("Tagline", s, "tagline"),
        textField("Footer paragraph", s, "blurb", { multiline: true })
      ]),

      card("Address & phone", [
        h("div", { class: "grid grid--2" }, [
          textField("Street", c, "address1"),
          textField("Town, state, ZIP", c, "address2")
        ]),
        h("div", { class: "grid grid--3" }, [
          textField("Phone as guests should read it", c, "phone", { placeholder: "904 402 9212" }),
          textField("Phone for the tap-to-call link", c, "phoneDigits", { placeholder: "+19044029212", hint: "Digits only, with country code" }),
          textField("Email", c, "email", { type: "email", placeholder: "hello@example.com" })
        ]),
        textField("What the map should search for", c, "mapQuery", { hint: "Usually just the full address" })
      ]),

      card("Opening hours", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "Days marked closed are greyed out on the booking calendar, so guests cannot request a table then. Consecutive days with the same hours are joined together in the footer." })
      ].concat(hours.map(function (row) {
        return h("div", { class: "row", style: "display:grid;grid-template-columns:110px 1fr 1fr auto;align-items:end;gap:.6rem" }, [
          h("div", { class: "field" }, [h("label", { text: "Day" }), h("input", { type: "text", value: row.day, disabled: true })]),
          row.closed ? h("span") : textField("Opens", row, "open", { placeholder: "8:00 AM" }),
          row.closed ? h("span") : textField("Closes", row, "close", { placeholder: "9:00 PM" }),
          checkField("Closed", row, "closed", { rerender: true })
        ]);
      })).concat([
        textField("Extra note under the hours", s, "hoursNote", { placeholder: "Special Menu Night — call ahead" })
      ])),

      card("Social links", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "Leave one blank and its icon is hidden, rather than being shown as a link that goes nowhere — which is what the site used to do." }),
        h("div", { class: "grid grid--3" }, [
          textField("Instagram", s.socials, "instagram", { type: "url", placeholder: "https://instagram.com/…" }),
          textField("Facebook", s.socials, "facebook", { type: "url", placeholder: "https://facebook.com/…" }),
          textField("X / Twitter", s.socials, "twitter", { type: "url", placeholder: "https://x.com/…" })
        ])
      ]),

      card("Confirm these are right", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "Some of these were carried over from the site's first draft, or guessed. Tick each one once you know it is correct — the Overview screen keeps reminding you until they are all ticked." }),
        h("div", { class: "grid grid--2" }, [
          checkField("The restaurant name is correct", v, "name", { rerender: true }),
          checkField("The street address is correct", v, "address", { rerender: true }),
          checkField("The phone number is correct", v, "phone", { rerender: true }),
          checkField("The email address is correct", v, "email", { rerender: true }),
          checkField("The opening hours are correct", v, "hours", { rerender: true }),
          checkField("The social links are correct", v, "socials", { rerender: true })
        ])
      ])
    ];
  }

  /* =====================================================
     VIEW — PUBLISH
     ===================================================== */
  var publishState = { publisher: (Meta.read().publisher || "github"), busy: false, result: null };

  function viewPublish() {
    var list = changed();
    var files = Serializer.filesFor(draft, published);
    var pub = Store.get(publishState.publisher);

    var LABELS = {
      settings: "Info, hours and social links", menu: "Menu, prices and the daily special",
      shop: "Shop products", gallery: "Gallery photos", blog: "Blog posts", home: "Homepage"
    };

    var head = [
      pageHead("Publish", "Nothing you have edited is public until you press the button on this screen."),
      actionbar()
    ];

    if (!list.length) {
      return head.concat([
        card(null, [
          h("div", { class: "notice notice--good" }, [
            h("span", { class: "notice__ico", text: "✓" }),
            h("div", {}, [h("b", { text: "Nothing to publish." }),
              h("p", { text: "The website matches what is in the dashboard." })])
          ])
        ])
      ]);
    }

    var resultNode = publishState.result
      ? h("div", { class: "notice " + (publishState.result.ok ? "notice--good" : "notice--bad") }, [
          h("span", { class: "notice__ico", text: publishState.result.ok ? "✓" : "!" }),
          h("div", {}, [
            h("b", { text: publishState.result.ok ? "Published" : "Not published" }),
            h("p", { text: publishState.result.message }),
            publishState.result.url
              ? h("p", {}, [h("a", { href: publishState.result.url, target: "_blank", rel: "noopener", text: "See the change on GitHub ↗" })])
              : null
          ])
        ])
      : null;

    return head.concat([
      resultNode,

      card("What will change", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "One commit, " + files.length + (files.length === 1 ? " file" : " files") + ". Everything else on the site is left alone." })
      ].concat(files.map(function (f) {
        return h("div", { class: "diff" }, [
          h("div", { class: "diff__head" }, [
            h("b", { text: LABELS[f.section] || f.section }),
            h("span", { class: "grow" }),
            h("span", { class: "file mono", text: f.path })
          ]),
          h("pre", { text: f.text })
        ]);
      }))),

      card("Where to publish", [
        selectField("Method", publishState, "publisher",
          Store.publishers.map(function (p) { return { value: p.id, label: p.label }; }),
          { rerender: true }),
        h("p", { class: "card__hint", text: pub.help }),
        pub.isConfigured()
          ? null
          : h("div", { class: "notice notice--warn" }, [
              h("span", { class: "notice__ico", text: "·" }),
              h("div", {}, [h("b", { text: "This method is not set up." }),
                h("p", { text: "Open Settings to connect it, or choose “Download the files”, which always works." })])
            ]),
        textField("Note to record with this change", publishState, "message", {
          placeholder: "e.g. New prices for the fish platters",
          hint: "Saved with the change so you can see later what was altered and when."
        }),
        h("div", { style: "display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.9rem" }, [
          h("button", {
            class: "btn btn--primary", type: "button", disabled: publishState.busy || !pub.isConfigured(),
            onclick: function () { doPublish(pub, files); }
          }, [publishState.busy ? "Publishing…" : "Publish now"]),
          h("button", {
            class: "btn btn--danger", type: "button", disabled: publishState.busy,
            onclick: function () {
              if (!confirm("Throw away every unpublished change and go back to what is on the website right now?")) return;
              Draft.clear();
              location.reload();
            }
          }, ["Discard all my changes"])
        ])
      ])
    ]);
  }

  function doPublish(pub, files) {
    publishState.busy = true;
    publishState.result = null;
    render();

    var note = (publishState.message || "").trim();
    var sections = files.map(function (f) { return f.section; }).join(", ");
    var message = "Dashboard: update " + sections + (note ? "\n\n" + note : "");

    pub.publish(files, message).then(function (res) {
      publishState.busy = false;
      publishState.result = res;

      if (res.ok) {
        Meta.set({
          lastPublished: new Date().toLocaleString(),
          lastPublishedAt: Date.now(),
          publisher: pub.id
        });

        /* What we just sent IS the new published state. This page is still
           running the old content files, so adopt the draft as the baseline
           in memory — otherwise every section would keep showing as
           "changed" until the deploy finished and the page was reloaded.
           The draft is then cleared, so a reload starts from the files. */
        Store.SECTIONS.forEach(function (s) { published[s] = clone(draft[s]); });
        Draft.clear();
      }
      render();
      paintNav();
      window.scrollTo(0, 0);
    });
  }

  /* =====================================================
     VIEW — SETTINGS
     ===================================================== */
  function viewSettings() {
    var gh = Store.get("github");
    var sb = Store.get("supabase");
    var ghc = gh.config();
    var sbc = sb.config();
    var testNode = h("div", { id: "conn-result" });

    function testButton(publisher) {
      return h("button", {
        class: "btn", type: "button",
        onclick: function (e) {
          var btn = e.target;
          btn.disabled = true; btn.textContent = "Checking…";
          publisher.verify().then(function (res) {
            btn.disabled = false; btn.textContent = "Test connection";
            fill(testNode, [
              h("div", { class: "notice " + (res.ok ? "notice--good" : "notice--bad") }, [
                h("span", { class: "notice__ico", text: res.ok ? "✓" : "!" }),
                h("div", {}, [h("p", { text: res.message })])
              ])
            ]);
          });
        }
      }, ["Test connection"]);
    }

    return [
      pageHead("Settings", "How this dashboard connects to the website, and who can open it."),

      card("Publishing to GitHub", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "This dashboard commits the content files to your repository, and the deploy you already have running publishes them. Nothing else in the repository is touched." }),
        h("div", { class: "grid grid--3" }, [
          textField("Owner", ghc, "owner", { placeholder: "Inova01" }),
          textField("Repository", ghc, "repo", { placeholder: "Resto_Sevenwonders" }),
          textField("Branch", ghc, "branch", { placeholder: "main" })
        ]),
        textField("Access token", ghc, "token", {
          type: "password",
          placeholder: "github_pat_…",
          hint: "Fine-grained token, this repository only, Contents: Read and write. Give it an expiry date."
        }),
        h("div", { class: "notice notice--warn" }, [
          h("span", { class: "notice__ico", text: "·" }),
          h("div", {}, [
            h("b", { text: "About this token" }),
            h("p", { text: "It is kept in this browser only — never sent anywhere except GitHub, and not committed to the site. " +
              "But anything running in this browser could read it, so scope it to this one repository, give it an expiry, " +
              "and do not set it up on a shared or public computer. If a token ever leaks, delete it in GitHub settings and make a new one." })
          ])
        ]),
        h("div", { style: "display:flex;gap:.6rem;flex-wrap:wrap" }, [
          h("button", {
            class: "btn btn--primary", type: "button",
            onclick: function () { gh.setConfig(ghc); fill(testNode, [h("p", { class: "card__hint", text: "Saved." })]); }
          }, ["Save"]),
          testButton(gh),
          h("button", {
            class: "btn btn--danger", type: "button",
            onclick: function () {
              if (!confirm("Forget the token and repository details stored in this browser?")) return;
              gh.setConfig({ owner: "", repo: "", branch: "main", token: "" });
              render();
            }
          }, ["Forget these details"])
        ]),
        testNode
      ]),

      card("Screen lock", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "An optional PIN, checked in the browser. It stops someone who stumbles onto the address from seeing the editor. " +
          "It is not security — a determined person can get past it — and it does not protect the live site. The publish token does that. " +
          "ADMIN.md explains how to put a real login in front of this page if you need one." }),
        h("div", { style: "display:flex;gap:.6rem;flex-wrap:wrap;align-items:end" }, [
          h("div", { class: "field", style: "flex:1 1 200px" }, [
            h("label", { text: "New PIN", for: "new-pin" }),
            h("input", { type: "password", id: "new-pin", inputmode: "numeric", placeholder: "leave blank to remove" })
          ]),
          h("button", {
            class: "btn btn--primary", type: "button",
            onclick: function () {
              var pin = ($("#new-pin").value || "").trim();
              if (!pin) {
                Meta.set({ pinHash: null });
                alert("PIN removed. The dashboard will open without asking.");
                $("#new-pin").value = "";
                return;
              }
              hashPin(pin).then(function (hash) {
                Meta.set({ pinHash: hash });
                $("#new-pin").value = "";
                alert("PIN set. You will be asked for it next time you open this page.");
              });
            }
          }, ["Save PIN"])
        ]),
        Meta.read().pinHash
          ? h("p", { class: "card__hint", text: "A PIN is currently set." })
          : h("p", { class: "card__hint", text: "No PIN set — the dashboard opens straight away." })
      ]),

      card("Supabase (later)", [
        h("p", { class: "card__hint", style: "margin-top:0", text: sb.help }),
        h("div", { class: "grid grid--3" }, [
          textField("Project URL", sbc, "url", { placeholder: "https://xxxx.supabase.co" }),
          textField("Anon key", sbc, "anonKey", { type: "password" }),
          textField("Table", sbc, "table", { placeholder: "site_content" })
        ]),
        h("div", { style: "display:flex;gap:.6rem;flex-wrap:wrap" }, [
          h("button", {
            class: "btn", type: "button",
            onclick: function () { sb.setConfig(sbc); alert("Saved."); }
          }, ["Save"]),
          testButton(sb)
        ])
      ]),

      card("This browser", [
        h("p", { class: "card__hint", style: "margin-top:0", text:
          "Your unpublished changes live in this browser only. They are not on another computer, and clearing your browser data will remove them." }),
        h("div", { style: "display:flex;gap:.6rem;flex-wrap:wrap" }, [
          h("a", { class: "btn", href: "index.html?preview=1", target: "_blank", rel: "noopener" }, ["Preview the site ↗"]),
          h("button", {
            class: "btn btn--danger", type: "button",
            onclick: function () {
              if (!confirm("Throw away every unpublished change?")) return;
              Draft.clear();
              location.reload();
            }
          }, ["Discard unpublished changes"])
        ])
      ])
    ];
  }

  /* =====================================================
     PIN gate (privacy screen, openly described as such)
     ===================================================== */
  function hashPin(pin) {
    var data = new TextEncoder().encode("sw-admin:" + pin);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }

  function startGate() {
    var meta = Meta.read();
    if (!meta.pinHash) return openApp();

    var gate = $("#gate");
    gate.hidden = false;
    $("#gate-form").addEventListener("submit", function (e) {
      e.preventDefault();
      hashPin($("#gate-pin").value).then(function (hash) {
        if (hash === Meta.read().pinHash) {
          gate.hidden = true;
          openApp();
        } else {
          $("#gate-msg").textContent = "That PIN does not match.";
          $("#gate-pin").value = "";
          $("#gate-pin").focus();
        }
      });
    });
    $("#gate-pin").focus();
  }

  function openApp() {
    $("#shell").hidden = false;
    paintNav();
    render();
  }

  /* =====================================================
     RENDER
     ===================================================== */
  var RENDERERS = {
    overview: viewOverview, menu: viewMenu, shop: viewShop, gallery: viewGallery,
    blog: viewBlog, home: viewHome, about: viewAbout, info: viewInfo,
    publish: viewPublish, settings: viewSettings
  };

  function render() {
    var fn = RENDERERS[state.view] || viewOverview;
    var nodes;
    try {
      nodes = fn();
    } catch (err) {
      console.error(err);
      nodes = [
        pageHead("Something went wrong", "This screen could not be drawn. Your unpublished changes are still saved."),
        h("div", { class: "notice notice--bad" }, [
          h("span", { class: "notice__ico", text: "!" }),
          h("div", {}, [h("b", { text: String(err && err.message || err) }),
            h("p", { text: "Try another screen from the menu. If it keeps happening, use Settings → Discard unpublished changes." })])
        ])
      ];
    }
    fill($("#view"), nodes);
  }

  /* Warn before leaving with work that has not been published. The draft
     is safe in the browser, but the website is still showing the old text
     and it is worth saying so. */
  window.addEventListener("beforeunload", function (e) {
    if (publishState.busy) { e.preventDefault(); e.returnValue = ""; }
  });

  startGate();
})();
