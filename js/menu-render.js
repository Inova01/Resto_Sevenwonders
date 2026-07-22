/* =========================================================
   SEVEN WONDERS — menu-render.js
   Renders the data-driven MENU tabs + the ORDER section from
   window.SW_MENU (js/menu-data.js). No dependencies.
   ========================================================= */
(function () {
  "use strict";

  var DATA = window.SW_MENU;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };

  var LS_KEY = "sw_order_v1";
  var WEB3_KEY = "PLACEHOLDER_WEB3FORMS_KEY";

  var FORK_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 3v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3"/><path d="M6 11v10"/>' +
    '<path d="M18 3c-1.5 0-3 1.8-3 5s1.5 4 3 4"/><path d="M18 12v9"/></svg>';

  function money(n) { return "$" + n.toFixed(2); }

  /* ---------- persistent state ---------- */
  var state = {
    cat: null, sub: null,
    selections: {},   // { subcatId: {itemId, qty} }
    addons: {},       // { addonId: true }
    customer: {},
  };
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify({
      selections: state.selections, addons: state.addons, customer: state.customer
    })); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      state.selections = o.selections || {};
      state.addons = o.addons || {};
      state.customer = o.customer || {};
    } catch (e) {}
  }

  /* ---------- data lookups ---------- */
  function eachItem(fn) {
    DATA.categories.forEach(function (cat) {
      cat.subcats.forEach(function (sub) {
        sub.items.forEach(function (it) { fn(it, sub, cat); });
      });
    });
  }
  function findItem(id) {
    var found = null;
    eachItem(function (it) { if (it.id === id) found = it; });
    if (!found) {
      DATA.drinks.concat(DATA.desserts).forEach(function (a) { if (a.id === id) found = a; });
    }
    return found;
  }

  /* =====================================================
     MENU TABS (browsing)
     ===================================================== */
  function thumb(item) {
    if (item.img) {
      return '<img class="menu-item__thumb" src="' + item.img + '" alt="' + item.name + '" loading="lazy" />';
    }
    return '<span class="menu-item__thumb menu-item__thumb--ph" aria-hidden="true">' + FORK_SVG + "</span>";
  }

  function renderCats() {
    var wrap = $("#menu-cats");
    wrap.innerHTML = "";
    DATA.categories.forEach(function (cat) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "menu-tab";
      b.setAttribute("role", "tab");
      b.dataset.cat = cat.id;
      b.setAttribute("aria-selected", String(cat.id === state.cat));
      b.textContent = cat.label;
      b.addEventListener("click", function () { selectCat(cat.id); });
      wrap.appendChild(b);
    });
  }

  function renderSubcats() {
    var cat = DATA.categories.filter(function (c) { return c.id === state.cat; })[0];
    var wrap = $("#menu-subcats");
    wrap.innerHTML = "";
    cat.subcats.forEach(function (sub) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "subcat-pill" + (sub.id === state.sub ? " active" : "");
      b.setAttribute("role", "tab");
      b.dataset.sub = sub.id;
      b.setAttribute("aria-selected", String(sub.id === state.sub));
      b.textContent = sub.label;
      b.addEventListener("click", function () { selectSub(sub.id); });
      wrap.appendChild(b);
    });
  }

  function renderPanel() {
    var cat = DATA.categories.filter(function (c) { return c.id === state.cat; })[0];
    var sub = cat.subcats.filter(function (s) { return s.id === state.sub; })[0];
    var list = $("#menu-list");
    list.innerHTML = "";
    sub.items.forEach(function (it) {
      var row = document.createElement("div");
      row.className = "menu-item";
      var priceHtml = it.price == null
        ? '<span class="menu-item__price">' + (it.priceLabel || "Variable") + "</span>"
        : '<span class="menu-item__price">' + money(it.price) + "</span>";
      var badge = it.badge ? '<span class="badge-new">' + it.badge + "</span>" : "";
      row.innerHTML =
        thumb(it) +
        "<div>" +
          '<div class="menu-item__head">' +
            '<span class="menu-item__name">' + it.name + "</span>" +
            badge +
            '<span class="menu-item__leader"></span>' +
            priceHtml +
          "</div>" +
          (it.desc ? '<p class="menu-item__desc">' + it.desc + "</p>" : "") +
        "</div>";
      list.appendChild(row);
    });
    // arched photo
    var img = $("#menu-photo-img");
    if (img && cat.photo) { img.src = cat.photo; img.alt = cat.label + " at Seven Wonders"; }
    // restart fade
    if (!reduceMotion) { list.style.animation = "none"; void list.offsetWidth; list.style.animation = ""; }
  }

  function selectCat(id) {
    if (id === state.cat) return;
    state.cat = id;
    var cat = DATA.categories.filter(function (c) { return c.id === id; })[0];
    state.sub = cat.subcats[0].id;
    renderCats(); renderSubcats(); renderPanel();
  }
  function selectSub(id) {
    if (id === state.sub) return;
    state.sub = id;
    renderSubcats(); renderPanel();
  }

  /* =====================================================
     ORDER BUILDER
     ===================================================== */
  function renderOrderDishes() {
    var host = $("#order-dishes");
    host.innerHTML = "";
    DATA.categories.forEach(function (cat) {
      var group = document.createElement("div");
      group.className = "order-group";
      group.innerHTML = '<h3 class="order-group__title">' + cat.label + "</h3>";
      cat.subcats.forEach(function (sub) {
        var sh = document.createElement("p");
        sh.className = "order-group__sub";
        sh.textContent = sub.label;
        group.appendChild(sh);
        sub.items.forEach(function (it) {
          group.appendChild(dishRow(it, sub));
        });
      });
      host.appendChild(group);
    });
  }

  function dishRow(it, sub) {
    var sel = state.selections[sub.id];
    var checked = sel && sel.itemId === it.id;
    var qty = checked ? sel.qty : 1;

    var row = document.createElement("div");
    row.className = "order-dish";

    var radio = document.createElement("input");
    radio.type = "radio";
    radio.className = "order-radio";
    radio.name = "dish-" + sub.id;
    radio.value = it.id;
    radio.checked = !!checked;
    radio.id = "r-" + it.id;
    radio.addEventListener("change", function () {
      state.selections[sub.id] = { itemId: it.id, qty: (state.selections[sub.id] && state.selections[sub.id].itemId === it.id) ? state.selections[sub.id].qty : 1 };
      syncOrder();
    });

    var label = document.createElement("label");
    label.className = "order-dish__label";
    label.setAttribute("for", radio.id);
    var priceHtml = it.price == null
      ? '<span class="order-dish__vary">price varies</span>'
      : '<span class="order-dish__price">' + money(it.price) + "</span>";
    label.innerHTML =
      '<span class="order-dish__name">' + it.name + "</span>" +
      (it.desc ? '<span class="order-dish__desc">' + it.desc + "</span>" : "") +
      priceHtml;

    var stepper = makeStepper(qty, !checked, function (v) {
      if (state.selections[sub.id] && state.selections[sub.id].itemId === it.id) {
        state.selections[sub.id].qty = v; syncOrder();
      }
    });
    stepper.dataset.for = it.id;

    row.appendChild(radio);
    row.appendChild(label);
    row.appendChild(stepper);
    return row;
  }

  function makeStepper(val, hidden, onChange) {
    var wrap = document.createElement("div");
    wrap.className = "qty";
    if (hidden) wrap.hidden = true;
    var minus = document.createElement("button");
    minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", "Decrease quantity");
    var num = document.createElement("span"); num.textContent = String(val);
    var plus = document.createElement("button");
    plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", "Increase quantity");
    function set(v) { v = Math.max(1, Math.min(10, v)); num.textContent = String(v); minus.disabled = v <= 1; plus.disabled = v >= 10; onChange(v); }
    minus.addEventListener("click", function () { set(parseInt(num.textContent, 10) - 1); });
    plus.addEventListener("click", function () { set(parseInt(num.textContent, 10) + 1); });
    minus.disabled = val <= 1; plus.disabled = val >= 10;
    wrap.appendChild(minus); wrap.appendChild(num); wrap.appendChild(plus);
    return wrap;
  }

  /* ---------- add-ons ---------- */
  function renderAddons() {
    var host = $("#order-addons");
    host.innerHTML = "";
    host.appendChild(addonGroup("Add a Dessert", DATA.desserts,
      "No desserts on the menu yet — add them in js/menu-data.js and this section appears automatically."));
    host.appendChild(addonGroup("Add a Drink", DATA.drinks, ""));
  }

  function addonGroup(title, items, emptyNote) {
    var g = document.createElement("div");
    g.className = "order-group";
    g.innerHTML = '<h3 class="order-group__title">' + title + "</h3>";
    if (!items.length) {
      if (emptyNote) { var p = document.createElement("p"); p.className = "order-note"; p.textContent = emptyNote; g.appendChild(p); }
      return g;
    }
    var grid = document.createElement("div");
    grid.className = "addon-grid";
    items.forEach(function (it) {
      var card = document.createElement("label");
      card.className = "addon-card" + (state.addons[it.id] ? " checked" : "");
      var cb = document.createElement("input");
      cb.type = "checkbox"; cb.value = it.id; cb.checked = !!state.addons[it.id];
      cb.addEventListener("change", function () {
        if (cb.checked) state.addons[it.id] = true; else delete state.addons[it.id];
        card.classList.toggle("checked", cb.checked);
        syncOrder();
      });
      card.appendChild(cb);
      var box = document.createElement("span"); box.className = "addon-card__box"; box.setAttribute("aria-hidden", "true");
      var name = document.createElement("span"); name.className = "addon-card__name"; name.textContent = it.name;
      var price = document.createElement("span"); price.className = "addon-card__price"; price.textContent = money(it.price);
      card.appendChild(box); card.appendChild(name); card.appendChild(price);
      grid.appendChild(card);
    });
    g.appendChild(grid);
    return g;
  }

  /* ---------- summary ---------- */
  function orderLines() {
    var lines = [];
    Object.keys(state.selections).forEach(function (subId) {
      var sel = state.selections[subId];
      var it = findItem(sel.itemId);
      if (it) lines.push({ kind: "dish", subId: subId, id: it.id, name: it.name, desc: it.desc, qty: sel.qty, price: it.price });
    });
    Object.keys(state.addons).forEach(function (id) {
      var it = findItem(id);
      if (it) lines.push({ kind: "addon", id: id, name: it.name, qty: 1, price: it.price });
    });
    return lines;
  }

  function renderSummary() {
    var lines = orderLines();
    var host = $("#order-lines");
    host.innerHTML = "";
    if (!lines.length) {
      host.innerHTML = '<p class="order-empty">No items yet — select dishes and add-ons above.</p>';
    }
    var total = 0;
    lines.forEach(function (ln) {
      var row = document.createElement("div");
      row.className = "order-line";
      var rm = document.createElement("button");
      rm.type = "button"; rm.className = "order-line__rm"; rm.setAttribute("aria-label", "Remove " + ln.name); rm.textContent = "✕";
      rm.addEventListener("click", function () {
        if (ln.kind === "dish") delete state.selections[ln.subId];
        else delete state.addons[ln.id];
        renderOrderDishes(); renderAddons(); syncOrder();
      });
      var nameCell = document.createElement("div");
      nameCell.className = "order-line__name";
      var totCell = document.createElement("div");
      totCell.className = "order-line__tot";
      var descTxt = ln.desc ? ' <span style="color:var(--muted)">(' + ln.desc + ")</span>" : "";
      if (ln.price == null) {
        nameCell.innerHTML = "<b>" + ln.qty + "×</b> " + ln.name + descTxt;
        totCell.textContent = "varies";
        var meta = document.createElement("div"); meta.className = "order-line__meta"; meta.textContent = "price confirmed on order";
        row.appendChild(rm); row.appendChild(nameCell); row.appendChild(totCell); row.appendChild(meta);
      } else {
        var lineTot = ln.price * ln.qty;
        total += lineTot;
        nameCell.innerHTML = "<b>" + ln.qty + "×</b> " + ln.name + descTxt + ' <span class="order-line__meta" style="display:inline">@ ' + money(ln.price) + "</span>";
        totCell.textContent = money(lineTot);
        row.appendChild(rm); row.appendChild(nameCell); row.appendChild(totCell);
      }
      host.appendChild(row);
    });
    $("#order-total").textContent = money(total);
    return total;
  }

  function syncOrder() { renderSummary(); save(); }

  /* ---------- customer form ---------- */
  function buildForm() {
    var c = state.customer || {};
    var host = $("#order-form");
    host.innerHTML =
      '<div class="form-status" role="status" aria-live="polite"></div>' +
      '<div class="form-grid">' +
        field("Name", "o-name", "text", "Jane Doe", c.name, true) +
        field("Phone", "o-phone", "tel", "+1 904 402 9212", c.phone, true) +
        field("Email", "o-email", "email", "you@email.com", c.email, true) +
        '<div class="field field--full">' +
          "<label>Pickup or Delivery</label>" +
          '<div class="pill-radios">' +
            '<label class="pill-radio"><input type="radio" name="fulfil" value="Pickup"' + (c.fulfillment !== "Delivery" ? " checked" : "") + '><span>Pickup</span></label>' +
            '<label class="pill-radio"><input type="radio" name="fulfil" value="Delivery"' + (c.fulfillment === "Delivery" ? " checked" : "") + '><span>Delivery</span></label>' +
          "</div>" +
        "</div>" +
        '<div class="field field--full" id="f-address"' + (c.fulfillment === "Delivery" ? "" : " hidden") + ">" +
          '<label for="o-address">Delivery Address</label>' +
          '<input id="o-address" type="text" placeholder="Street, city, ZIP" value="' + (c.address || "") + '" />' +
          '<span class="field__err">Please enter a delivery address.</span>' +
        "</div>" +
        field("Preferred Time", "o-time", "text", "e.g. Today 7:00 PM", c.time, false) +
        '<div class="field field--full">' +
          '<label for="o-notes">Notes</label>' +
          '<textarea id="o-notes" placeholder="Allergies, spice level, special requests…">' + (c.notes || "") + "</textarea>" +
        "</div>" +
        '<div class="field field--full">' +
          '<button type="submit" class="btn btn--primary btn--block">Send Order</button>' +
        "</div>" +
      "</div>" +
      '<div class="order-recap" id="order-recap"></div>';

    // delivery toggle
    host.querySelectorAll('input[name="fulfil"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var isDel = host.querySelector('input[name="fulfil"]:checked').value === "Delivery";
        $("#f-address", host).hidden = !isDel;
        rememberCustomer();
      });
    });
    // remember on input
    host.addEventListener("input", rememberCustomer);
    host.addEventListener("submit", onSubmit);
  }

  function field(label, id, type, ph, val, req) {
    return '<div class="field">' +
      '<label for="' + id + '">' + label + (req ? "" : " <span style=\"color:var(--muted)\">(optional)</span>") + "</label>" +
      '<input id="' + id + '" type="' + type + '" placeholder="' + ph + '" value="' + (val || "") + '" />' +
      '<span class="field__err">Please enter your ' + label.toLowerCase() + ".</span>" +
      "</div>";
  }

  function rememberCustomer() {
    var f = $("#order-form");
    state.customer = {
      name: val("#o-name"), phone: val("#o-phone"), email: val("#o-email"),
      fulfillment: (f.querySelector('input[name="fulfil"]:checked') || {}).value || "Pickup",
      address: val("#o-address"), time: val("#o-time"), notes: val("#o-notes"),
    };
    save();
  }
  function val(sel) { var el = $(sel); return el ? el.value.trim() : ""; }

  /* ---------- validation + submit ---------- */
  function setErr(fieldId, on) {
    var el = $(fieldId);
    if (el) el.closest(".field").classList.toggle("invalid", on);
  }
  function validate() {
    var ok = true;
    [["#o-name", val("#o-name")], ["#o-phone", val("#o-phone")]].forEach(function (p) {
      var bad = !p[1]; setErr(p[0], bad); if (bad) ok = false;
    });
    var email = val("#o-email");
    var emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setErr("#o-email", emailBad); if (emailBad) ok = false;
    var isDel = ($("#order-form").querySelector('input[name="fulfil"]:checked') || {}).value === "Delivery";
    if (isDel) { var badA = !val("#o-address"); setErr("#o-address", badA); if (badA) ok = false; }
    return ok;
  }

  function buildMessage() {
    var lines = orderLines();
    var out = ["SEVEN WONDERS BAKERY & GRILL — NEW ORDER", ""];
    var dishes = lines.filter(function (l) { return l.kind === "dish"; });
    var addons = lines.filter(function (l) { return l.kind === "addon"; });
    var total = 0;
    if (dishes.length) {
      out.push("ORDER:");
      dishes.forEach(function (l) {
        var nm = l.name + (l.desc ? " (" + l.desc + ")" : "");
        if (l.price == null) out.push("  " + l.qty + " x " + nm + " — price varies");
        else { total += l.price * l.qty; out.push("  " + l.qty + " x " + nm + " — " + money(l.price) + " = " + money(l.price * l.qty)); }
      });
      out.push("");
    }
    if (addons.length) {
      out.push("ADD-ONS:");
      addons.forEach(function (l) { total += l.price * l.qty; out.push("  " + l.qty + " x " + l.name + " — " + money(l.price)); });
      out.push("");
    }
    out.push("TOTAL: " + money(total));
    out.push("");
    out.push("CUSTOMER:");
    out.push("  Name: " + val("#o-name"));
    out.push("  Phone: " + val("#o-phone"));
    out.push("  Email: " + val("#o-email"));
    var isDel = ($("#order-form").querySelector('input[name="fulfil"]:checked') || {}).value === "Delivery";
    out.push("  Fulfillment: " + (isDel ? "Delivery" : "Pickup"));
    if (isDel) out.push("  Address: " + val("#o-address"));
    if (val("#o-time")) out.push("  Preferred time: " + val("#o-time"));
    if (val("#o-notes")) out.push("  Notes: " + val("#o-notes"));
    return out.join("\n");
  }

  function showStatus(type, msg) {
    var el = $(".form-status", $("#order-form"));
    if (!el) return;
    el.className = "form-status show " + type;
    el.textContent = msg;
  }

  function onSubmit(e) {
    e.preventDefault();
    rememberCustomer();
    if (!orderLines().length) { showStatus("error", "Your order is empty — please select at least one item."); return; }
    if (!validate()) { showStatus("error", "Please complete the highlighted fields."); return; }

    var message = buildMessage();
    var recapEl = $("#order-recap");
    var btn = $("#order-form button[type=submit]");

    function succeed() {
      showStatus("success", "Thank you! Your order has been sent. We'll call to confirm.");
      recapEl.textContent = message;
      recapEl.classList.add("show");
      // reset order items (keep customer details), clear storage of items
      state.selections = {}; state.addons = {};
      renderOrderDishes(); renderAddons(); renderSummary(); save();
      recapEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }

    if (!WEB3_KEY || WEB3_KEY.indexOf("PLACEHOLDER") !== -1) { succeed(); return; }

    var fd = new FormData();
    fd.append("access_key", WEB3_KEY);
    fd.append("subject", "New Online Order — Seven Wonders");
    fd.append("from_name", "Seven Wonders Website");
    fd.append("name", val("#o-name"));
    fd.append("email", val("#o-email"));
    fd.append("phone", val("#o-phone"));
    fd.append("message", message);
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: fd })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d.success) succeed(); else showStatus("error", d.message || "Something went wrong. Please call us."); })
      .catch(function () { showStatus("error", "Network error. Please try again or call us."); })
      .finally(function () { if (btn) { btn.disabled = false; btn.textContent = "Send Order"; } });
  }

  /* =====================================================
     INIT
     ===================================================== */
  function init() {
    if (!DATA || !$("#menu-root")) return;
    load();
    state.cat = DATA.categories[0].id;
    state.sub = DATA.categories[0].subcats[0].id;

    $("#menu-root").innerHTML =
      '<div class="section" style="padding-top:1rem">' +
        '<div class="container">' +
          '<div class="menu-tabs" id="menu-cats" role="tablist" aria-label="Menu categories"></div>' +
          '<div class="subcat-row" id="menu-subcats" role="tablist" aria-label="Sub-categories"></div>' +
          '<div class="menu-panel active" id="menu-panel">' +
            '<div class="menu-list" id="menu-list"></div>' +
            '<div class="menu-photo"><img id="menu-photo-img" src="" alt="" loading="lazy" /></div>' +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="section section--near menu-board-section">' +
        '<div class="container">' +
          '<div class="center" style="margin-bottom:2.4rem">' +
            '<p class="eyebrow">Printed Menu</p>' +
            '<h2 class="section-title">Current Menu Board</h2>' +
            '<p class="section-lead">Browse the latest Seven Wonders breakfast, lunch, dinner, beverage, beer and wine menu.</p>' +
          "</div>" +
          '<div class="menu-board-grid">' +
            '<a class="menu-board-card" href="assets/menu/menu-1.jpeg" target="_blank" rel="noopener">' +
              '<img src="assets/menu/menu-1.jpeg" alt="Seven Wonders updated food menu board" loading="lazy" />' +
            "</a>" +
            '<a class="menu-board-card" href="assets/menu/menu-2.jpeg" target="_blank" rel="noopener">' +
              '<img src="assets/menu/menu-2.jpeg" alt="Seven Wonders updated beverage, beer and wine menu board" loading="lazy" />' +
            "</a>" +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="section section--near" id="order">' +
        '<div class="container">' +
          '<div class="center" style="margin-bottom:2.6rem">' +
            '<p class="eyebrow">Place Your Order</p>' +
            '<h2 class="section-title">Order Now</h2>' +
            '<p class="section-lead">Choose your dishes, add drinks, and send us your order — we\'ll call to confirm. Pickup or delivery from ' + DATA.info.address + ".</p>" +
          "</div>" +
          '<div class="order-grid">' +
            '<div class="order-build">' +
              '<div id="order-dishes"></div>' +
              '<div id="order-addons"></div>' +
            "</div>" +
            '<aside class="order-summary">' +
              "<h3>Your Order</h3>" +
              '<div class="order-lines" id="order-lines"></div>' +
              '<div class="order-total-row"><span>Total</span><span class="order-total" id="order-total">$0.00</span></div>' +
              '<button type="button" class="order-clear" id="order-clear">Clear order</button>' +
              '<p class="order-note">Prices marked “varies” are confirmed by staff when you order.</p>' +
              '<form id="order-form" novalidate></form>' +
            "</aside>" +
          "</div>" +
        "</div>" +
      "</div>";

    renderCats(); renderSubcats(); renderPanel();
    renderOrderDishes(); renderAddons(); renderSummary(); buildForm();

    $("#order-clear").addEventListener("click", function () {
      state.selections = {}; state.addons = {};
      renderOrderDishes(); renderAddons(); renderSummary(); save();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
