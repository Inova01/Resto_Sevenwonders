/* =========================================================
   SEVEN WONDERS — main.js  (vanilla, no dependencies)
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function applyImageMeta(img, src, alt, opts = {}) {
    if (!img || !src) return;
    if (window.SWImage) window.SWImage.applyToImage(img, src, alt || "", opts);
    else {
      img.src = src;
      img.alt = alt || "";
      img.width = opts.width || 1;
      img.height = opts.height || 1;
      img.loading = opts.loading || "lazy";
      img.decoding = "async";
    }
  }

  /* -----------------------------------------------------
     1. MOBILE NAV DRAWER
  ----------------------------------------------------- */
  function initNav() {
    const burger   = $(".hamburger");
    const links    = $("#nav-links");
    const backdrop = $(".drawer-backdrop");
    if (!burger || !links) return;
    let lastFocus = null;
    const drawerFocusables = () => [burger].concat($$("a", links))
      .filter((el) => !el.disabled && !el.hidden);

    const setOpen = (open, moveFocus = false) => {
      burger.setAttribute("aria-expanded", String(open));
      links.classList.toggle("open", open);
      if (backdrop) backdrop.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        lastFocus = document.activeElement;
        if (moveFocus) {
          const firstLink = $("a", links);
          if (firstLink) firstLink.focus();
        }
      } else if (moveFocus && lastFocus && lastFocus.focus) {
        lastFocus.focus();
      }
    };

    burger.addEventListener("click", () => {
      const opening = burger.getAttribute("aria-expanded") !== "true";
      setOpen(opening, opening);
    });
    if (backdrop) backdrop.addEventListener("click", () => setOpen(false, true));
    $$("a", links).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      const open = burger.getAttribute("aria-expanded") === "true";
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false, true);
      } else if (e.key === "Tab") {
        const nodes = drawerFocusables();
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* -----------------------------------------------------
     2. CART + STRIPE CHECKOUT
     The browser stores only product ids and quantities. Prices are
     shown here for convenience, but the Stripe endpoint always
     re-prices from functions/_shared/shop-catalog.js.
  ----------------------------------------------------- */
  const CART_COUNT_KEY = "sw_cart_count";
  const CART_ITEMS_KEY = "sw_cart_items_v1";
  let lastCartFocus = null;

  function shopProducts() {
    return ((window.SW && SW.shop && SW.shop.products) || []).filter((p) => p && p.id);
  }
  function productById(id) {
    return shopProducts().filter((p) => p.id === id)[0] || null;
  }
  function effectivePrice(product) {
    return typeof product.sale === "number" && product.sale > 0 && product.sale < product.price
      ? product.sale
      : product.price;
  }
  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_ITEMS_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((row) => ({
          id: String(row && row.id || ""),
          qty: Math.max(0, Math.min(20, Math.floor(Number(row && row.qty) || 0)))
        }))
        .filter((row) => row.id && row.qty && productById(row.id));
    } catch (err) {
      return [];
    }
  }
  function writeCart(items) {
    const clean = (items || []).filter((row) => row.id && row.qty > 0);
    localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(clean));
    localStorage.setItem(CART_COUNT_KEY, String(clean.reduce((sum, row) => sum + row.qty, 0)));
  }
  function getCartCount() {
    return readCart().reduce((sum, row) => sum + row.qty, 0);
  }
  function cartRows() {
    const cart = readCart();
    const rows = cart
      .map((row) => ({ cart: row, product: productById(row.id) }))
      .filter((row) => row.product && row.product.inStock !== false);
    if (rows.length !== cart.length) writeCart(rows.map((row) => row.cart));
    return rows;
  }
  function cartTotal(rows) {
    return (rows || cartRows()).reduce((sum, row) => sum + effectivePrice(row.product) * row.cart.qty, 0);
  }
  function setCheckoutStatus(type, msg) {
    const status = $("#checkout-status");
    if (!status) return;
    status.className = "form-status show " + type;
    status.textContent = msg;
  }
  function clearCheckoutStatus() {
    const status = $("#checkout-status");
    if (!status) return;
    status.className = "form-status";
    status.textContent = "";
  }
  function money(n) {
    return window.SW && SW.money ? SW.money(n) : "$" + Number(n || 0).toFixed(2);
  }
  function renderBadge(pop) {
    const badge = $("#cart-badge");
    if (!badge) return;
    const count = getCartCount();
    badge.textContent = count;
    badge.style.visibility = count > 0 ? "visible" : "hidden";
    if (pop && !reduceMotion) {
      badge.classList.remove("pop");
      void badge.offsetWidth; // reflow to restart animation
      badge.classList.add("pop");
    }
  }
  function ensureCartDrawer() {
    if ($("#cart-drawer")) return;

    const backdrop = document.createElement("div");
    backdrop.className = "cart-drawer-backdrop";
    backdrop.setAttribute("data-cart-close", "");

    const drawer = document.createElement("aside");
    drawer.className = "cart-drawer";
    drawer.id = "cart-drawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-labelledby", "cart-drawer-title");
    drawer.setAttribute("aria-hidden", "true");
    drawer.tabIndex = -1;
    drawer.innerHTML =
      "<div class=\"cart-drawer__head\">" +
        "<div><p class=\"eyebrow\">Secure Checkout</p><h2 id=\"cart-drawer-title\">Your order</h2></div>" +
        "<button class=\"cart-drawer__close\" type=\"button\" data-cart-close aria-label=\"Close cart\">×</button>" +
      "</div>" +
      "<div class=\"cart-items\" id=\"cart-items\"></div>" +
      "<div class=\"cart-total\"><span>Total before tax</span><strong id=\"cart-total\">$0.00</strong></div>" +
      "<p class=\"cart-note\" id=\"cart-payment-note\"></p>" +
      "<button class=\"btn btn--primary btn--block\" type=\"button\" id=\"stripe-checkout\">Pay Now</button>" +
      "<button class=\"btn btn--ghost btn--block\" type=\"button\" data-cart-clear>Clear cart</button>" +
      "<p class=\"form-status\" id=\"checkout-status\"></p>";

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    $$("[data-cart-close]").forEach((btn) => btn.addEventListener("click", closeCartDrawer));
    const clear = $("[data-cart-clear]", drawer);
    if (clear) clear.addEventListener("click", () => {
      writeCart([]);
      clearCheckoutStatus();
      renderCartPanel();
    });
    const checkout = $("#stripe-checkout", drawer);
    if (checkout) checkout.addEventListener("click", startStripeCheckout);
  }
  function cartDrawerFocusables() {
    const drawer = $("#cart-drawer");
    if (!drawer) return [];
    return $$("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", drawer)
      .filter((el) => !el.disabled && !el.hidden);
  }
  function openCartDrawer() {
    ensureCartDrawer();
    const drawer = $("#cart-drawer");
    const backdrop = $(".cart-drawer-backdrop");
    if (!drawer) return;
    lastCartFocus = document.activeElement;
    renderCartPanel();
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    if (backdrop) backdrop.classList.add("open");
    document.body.classList.add("cart-drawer-open");
    document.body.style.overflow = "hidden";
    const focusables = cartDrawerFocusables();
    (focusables[0] || drawer).focus();
  }
  function closeCartDrawer() {
    const drawer = $("#cart-drawer");
    const backdrop = $(".cart-drawer-backdrop");
    if (!drawer || !drawer.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    if (backdrop) backdrop.classList.remove("open");
    document.body.classList.remove("cart-drawer-open");
    document.body.style.overflow = "";
    if (lastCartFocus && lastCartFocus.focus) lastCartFocus.focus();
  }
  function renderPaymentCapability(rows) {
    const checkout = $("#stripe-checkout");
    const note = $("#cart-payment-note");
    const status = $("#checkout-status");
    const clear = $("[data-cart-clear]");
    const hasRows = rows && rows.length > 0;
    const payment = window.SWPayment && SWPayment.state;
    const available = !!(payment && payment.available);

    if (clear) clear.disabled = !hasRows;
    if (!checkout) return;

    checkout.hidden = !hasRows;
    checkout.disabled = !hasRows;
    if (note) {
      note.textContent = !hasRows
        ? "Add items from the Shop page, then open this cart from anywhere on the site."
        : available
          ? "Pay Now opens Stripe. Final tax, pickup details and card information are handled securely there."
          : "Pay Now is integrated and will open Stripe as soon as the restaurant account is connected.";
    }
    if (status && hasRows && !available) {
      status.className = "form-status show warn";
      status.textContent = (payment && payment.message) || ((window.SWPayment && SWPayment.fallbackMessage()) || "Online payment is not connected yet.");
    } else if (status && status.className.indexOf("warn") !== -1) {
      clearCheckoutStatus();
    }
  }
  function renderCartPanel() {
    const wrap = $("#cart-items");
    const totalEl = $("#cart-total");
    if (!wrap || !totalEl) return;

    const rows = cartRows();

    wrap.innerHTML = "";
    if (!rows.length) {
      wrap.appendChild(Object.assign(document.createElement("p"), {
        className: "cart-empty",
        textContent: "Your cart is empty."
      }));
    } else {
      rows.forEach(({ cart: row, product }) => {
        const line = document.createElement("article");
        line.className = "cart-line";
        line.innerHTML =
          "<div class=\"cart-line__main\"><h3></h3><p></p></div>" +
          "<div class=\"cart-qty\">" +
          "<button type=\"button\" data-cart-dec=\"\">−</button>" +
          "<span></span>" +
          "<button type=\"button\" data-cart-inc=\"\">+</button>" +
          "</div>" +
          "<div class=\"cart-line__price\"></div>" +
          "<button class=\"cart-line__remove\" type=\"button\" data-cart-remove>Remove</button>";
        line.querySelector("h3").textContent = product.name;
        line.querySelector("p").textContent = product.note || "Seven Wonders favorite";
        line.querySelector(".cart-qty span").textContent = row.qty;
        line.querySelector(".cart-line__price").textContent =
          money(effectivePrice(product)) + " each · " + money(effectivePrice(product) * row.qty);
        line.querySelector("[data-cart-dec]").setAttribute("aria-label", "Remove one " + product.name);
        line.querySelector("[data-cart-inc]").setAttribute("aria-label", "Add one more " + product.name);
        line.querySelector("[data-cart-remove]").setAttribute("aria-label", "Remove " + product.name + " from cart");
        line.querySelector("[data-cart-dec]").addEventListener("click", () => changeQty(product.id, -1));
        line.querySelector("[data-cart-inc]").addEventListener("click", () => changeQty(product.id, 1));
        line.querySelector("[data-cart-remove]").addEventListener("click", () => changeQty(product.id, -row.qty));
        wrap.appendChild(line);
      });
    }

    totalEl.textContent = money(cartTotal(rows));
    renderPaymentCapability(rows);
    renderBadge(false);
  }
  function changeQty(id, delta) {
    const cart = readCart();
    const found = cart.filter((row) => row.id === id)[0];
    if (!found && delta > 0) cart.push({ id, qty: 1 });
    else if (found) found.qty = Math.max(0, Math.min(20, found.qty + delta));
    writeCart(cart.filter((row) => row.qty > 0));
    clearCheckoutStatus();
    renderCartPanel();
  }
  function addToCart(id) {
    if (!productById(id)) return;
    changeQty(id, 1);
  }
  function buyNow(id) {
    if (!productById(id)) return;
    addToCart(id);
    renderBadge(true);
    openCartDrawer();
    const checkout = $("#stripe-checkout");
    if (checkout && !checkout.disabled) checkout.focus();
  }
  async function startStripeCheckout() {
    const btn = $("#stripe-checkout");
    if (!btn) return;
    const cart = readCart();
    if (!cart.length) return;
    if (!window.SWPayment || !SWPayment.state.available) {
      setCheckoutStatus("warn", (window.SWPayment && SWPayment.fallbackMessage()) || "Online payment is not connected yet.");
      return;
    }
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Opening Stripe...";
    clearCheckoutStatus();
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "shop", items: cart, orderType: "pickup", clientTotal: cartTotal() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.detail || data.error || "Stripe checkout is not connected yet.");
      }
      window.location.assign(data.url);
    } catch (err) {
      const phone = ((window.SW && SW.settings && SW.settings.contact) || {}).phone || "904 402 9212";
      setCheckoutStatus("warn", (err && err.message ? err.message : "Stripe checkout is not connected yet.") +
        " Please call " + phone + " to place the order.");
      btn.disabled = false;
      btn.textContent = label;
    }
  }
  function handleCheckoutReturn() {
    const params = new URLSearchParams(window.location.search || "");
    if (params.get("checkout") === "success") {
      writeCart([]);
      renderCartPanel();
      setCheckoutStatus("success", "Payment complete. Thank you — Seven Wonders will prepare your order.");
    } else if (params.get("checkout") === "cancel") {
      setCheckoutStatus("warn", "Checkout was canceled. Your cart is still here when you are ready.");
    }
  }
  function initCart() {
    ensureCartDrawer();
    renderBadge(false);
    $$(".cart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openCartDrawer();
      });
    });
    document.addEventListener("click", (e) => {
      const buy = e.target.closest ? e.target.closest("[data-buy-now]") : null;
      if (buy) {
        e.preventDefault();
        buyNow(buy.getAttribute("data-buy-now"));
        return;
      }

      const btn = e.target.closest ? e.target.closest("[data-add-to-cart]") : null;
      if (!btn) return;
      const id = btn.getAttribute("data-add-to-cart");
      addToCart(id);
      renderBadge(true);
      const original = btn.dataset.label || btn.innerHTML;
      btn.dataset.label = original;
      btn.textContent = "Added";
      setTimeout(() => { btn.innerHTML = original; }, 1200);
    });
    document.addEventListener("keydown", (e) => {
      const drawer = $("#cart-drawer");
      if (!drawer || !drawer.classList.contains("open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeCartDrawer();
      } else if (e.key === "Tab") {
        const nodes = cartDrawerFocusables();
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    if (window.SWPayment) {
      document.addEventListener("sw:payment-capability", () => renderCartPanel());
      SWPayment.check().then(() => renderCartPanel());
    }
    renderCartPanel();
    handleCheckoutReturn();
  }

  /* -----------------------------------------------------
     3. EMBER / FIRE CANVAS (homepage hero)
  ----------------------------------------------------- */
  function initEmbers() {
    const canvas = $("#ember-canvas");
    if (!canvas || reduceMotion) return;

    // getContext can return null (canvas disabled, or too many live
    // contexts). The hero animation is decoration — skip it rather than
    // throwing, which would stop every init() after this one from running.
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w, h, particles = [], raf;
    const MAX = 40;
    const COLORS = ["#ED9E58", "#F7C08A", "#D97E33", "#ffcf99"];

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = rect.width * dpr;
      h = canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = rect.width; h = rect.height;
    }

    function spawn() {
      return {
        x: Math.random() * w,
        y: h + Math.random() * 40,
        r: 1 + Math.random() * 2.6,
        vy: 0.3 + Math.random() * 0.9,
        vx: (Math.random() - 0.5) * 0.4,
        life: 0,
        maxLife: 120 + Math.random() * 160,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        flick: Math.random() * Math.PI * 2,
      };
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      if (particles.length < MAX && Math.random() > 0.4) particles.push(spawn());

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.flick += 0.08;
        p.y -= p.vy;
        p.x += p.vx + Math.sin(p.flick) * 0.35;

        const t = p.life / p.maxLife;
        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;

        if (p.life >= p.maxLife || p.y < -10) { particles.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, alpha) * 0.85;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    tick();

    // Pause when hero is off-screen to save CPU
    const hero = canvas.closest(".hero");
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { if (!raf) tick(); }
          else { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0.01 }).observe(hero);
    }
  }

  /* -----------------------------------------------------
     4. MENU TABS (fade switch, no reload)
  ----------------------------------------------------- */
  function initMenuTabs() {
    const tabs = $$(".menu-tab");
    const panels = $$(".menu-panel");
    if (!tabs.length) return;

    function select(id) {
      tabs.forEach((t) =>
        t.setAttribute("aria-selected", String(t.dataset.tab === id))
      );
      panels.forEach((p) => p.classList.toggle("active", p.id === "panel-" + id));
    }
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => select(tab.dataset.tab));
      tab.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const i = tabs.indexOf(tab);
          const next = e.key === "ArrowRight"
            ? tabs[(i + 1) % tabs.length]
            : tabs[(i - 1 + tabs.length) % tabs.length];
          next.focus();
          select(next.dataset.tab);
        }
      });
    });
  }

  /* -----------------------------------------------------
     5. SCROLL REVEAL
  ----------------------------------------------------- */
  function initReveal() {
    const els = $$(".reveal");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* -----------------------------------------------------
     6. CALENDAR (real current month, apricot themed)
  ----------------------------------------------------- */
  function initCalendar() {
    const root = $("#calendar");
    if (!root) return;

    const monthNames = ["January","February","March","April","May","June",
      "July","August","September","October","November","December"];
    const today = new Date();
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();
    let selectedKey = null;

    const titleEl = $("#cal-title", root);
    const daysEl  = $("#cal-days", root);
    const dateInput = $("#res-date");
    const closedDays = window.SW && SW.closedWeekdays ? SW.closedWeekdays() : [];

    function render() {
      titleEl.textContent = monthNames[viewMonth] + " " + viewYear;
      daysEl.innerHTML = "";

      // JS getDay: 0=Sun..6=Sat. We want Monday-first.
      let firstDay = new Date(viewYear, viewMonth, 1).getDay();
      firstDay = (firstDay + 6) % 7; // Mon=0
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      for (let i = 0; i < firstDay; i++) {
        const b = document.createElement("button");
        b.className = "empty";
        b.tabIndex = -1;
        b.setAttribute("aria-hidden", "true");
        daysEl.appendChild(b);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = d;
        const key = `${viewYear}-${viewMonth}-${d}`;
        const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
        if (isToday) b.classList.add("today");
        if (key === selectedKey) b.classList.add("selected");
        const dateObj = new Date(viewYear, viewMonth, d);
        const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // Closed days come from the opening hours in content/settings.js,
        // so changing the hours in the dashboard also closes the calendar.
        const isClosed = closedDays.indexOf(dateObj.getDay()) !== -1;
        if (isPast || isClosed) { b.disabled = true; b.style.opacity = ".35"; }
        if (isClosed) b.classList.add("closed");
        b.setAttribute("aria-label",
          `${monthNames[viewMonth]} ${d}, ${viewYear}` + (isClosed ? " — closed" : ""));
        b.addEventListener("click", () => {
          selectedKey = key;
          if (dateInput) {
            const mm = String(viewMonth + 1).padStart(2, "0");
            const dd = String(d).padStart(2, "0");
            dateInput.value = `${viewYear}-${mm}-${dd}`;
          }
          render();
        });
        daysEl.appendChild(b);
      }
    }

    $("#cal-prev", root).addEventListener("click", () => {
      viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      render();
    });
    $("#cal-next", root).addEventListener("click", () => {
      viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      render();
    });
    render();
  }

  /* -----------------------------------------------------
     7. WEB3FORMS (reservation + contact) inline submit
  ----------------------------------------------------- */
  function initForms() {
    $$("form[data-web3form]").forEach((form) => {
      const status = $(".form-status", form);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const key = form.querySelector('[name="access_key"]').value;
        if (status) { status.className = "form-status"; }

        // No key configured yet. Never fake a confirmation — a guest who
        // believes a table is booked when nothing was sent is worse than
        // no form at all. Tell them, and give them the phone number.
        if (!key || key.includes("PLACEHOLDER")) {
          const phone = ((window.SW && SW.settings.contact) || {}).phone || "";
          showStatus(status, "warn",
            "This form is not connected yet, so your request was NOT sent." +
            (phone ? " Please call " + phone + " and we'll take your details." : ""));
          return;
        }
        const submitBtn = form.querySelector('[type="submit"]');
        const label = submitBtn ? submitBtn.textContent : "";
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }

        try {
          const res = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { Accept: "application/json" },
            body: new FormData(form),
          });
          const data = await res.json();
          if (data.success) {
            showStatus(status, "success", "Thank you! We'll confirm your booking shortly.");
            form.reset();
          } else {
            showStatus(status, "error", data.message || "Something went wrong. Please call us.");
          }
        } catch (err) {
          showStatus(status, "error", "Network error. Please try again or call us.");
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = label; }
        }
      });
    });
  }
  function showStatus(el, type, msg) {
    if (!el) return;
    el.className = `form-status show ${type}`;
    el.textContent = msg;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  /* -----------------------------------------------------
     8. BLOG post open/close (single-page detail)
  ----------------------------------------------------- */
  function initBlog() {
    const list = $("#blog-list");
    const detail = $("#blog-detail");
    if (!list || !detail) return;

    $$("[data-post]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const id = link.dataset.post;
        $$(".post-full").forEach((p) => p.classList.toggle("active", p.id === "post-" + id));
        list.style.display = "none";
        detail.style.display = "block";
        window.scrollTo({ top: detail.offsetTop - 90, behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
    $$(".back-link").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.preventDefault();
        detail.style.display = "none";
        list.style.display = "";
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      })
    );
  }

  /* -----------------------------------------------------
     9. MENU OF THE DAY — deterministic daily special
     Picks ONE real dish from the printed menu (js/menu-data.js): every
     LUNCH / DINNER main dish plus everything on Special Menu Night, minus
     sides, drinks and any "price varies" item. The pick is seeded from
     today's date, so it is the SAME for every visitor on a given day and
     survives page refreshes (pure date math, no storage) yet rotates on
     its own at midnight. A one-day guard stops the same dish showing two
     days in a row.
  ----------------------------------------------------- */
  function initMenuOfDay() {
    const root = $("#mod");
    if (!root) return;

    const menu = window.SW_MENU;
    if (!menu || !Array.isArray(menu.categories)) return;
    const today = new Date();

    // --- Which dish? --------------------------------------------------
    const chosen = window.SW && SW.dailySpecialForDate ? SW.dailySpecialForDate(today) : null;
    if (!chosen) return;
    const dish = chosen.item;

    // --- Pricing: the dashboard's discount, rounded to the nearest .50.
    // A discount of 0 shows the normal price with no strike-through. ---
    const money = (n) => "$" + n.toFixed(2);
    const promo = window.SW && SW.dailySpecialPrice ? SW.dailySpecialPrice(dish, today) : dish.price;

    // --- Photo: the dish's own photo, else its category's ---
    const photo = dish.img || (chosen.cat && chosen.cat.photo) || "assets/gallery/gallery-07.jpeg";

    // --- Current weekday, straight from the visitor's device ---
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // --- Paint the card ---
    const dayEl   = $("#mod-day", root);
    const nameEl  = $("#mod-name", root);
    const descEl  = $("#mod-desc", root);
    const priceEl = $("#mod-price", root);
    const img     = $("#mod-img", root);

    if (dayEl)  dayEl.textContent = DAYS[today.getDay()];
    if (nameEl) nameEl.textContent = dish.name;
    if (descEl) {
      const d = (dish.desc || "").trim();
      descEl.textContent = d;
      descEl.hidden = !d; // no real description on the menu → omit the line
    }
    if (priceEl) {
      priceEl.textContent = money(promo);
      if (promo < dish.price) {
        const was = document.createElement("small");
        was.textContent = money(dish.price);
        priceEl.appendChild(document.createTextNode(" "));
        priceEl.appendChild(was);
      }
    }
    if (img) {
      applyImageMeta(img, photo, dish.name + " — special of the day", {
        loading: "lazy",
        sizes: "(max-width: 900px) 92vw, 50vw"
      });
    }
  }

  /* -----------------------------------------------------
     10. TESTIMONIAL SLIDER (autoplay, arrows, dots, swipe)
  ----------------------------------------------------- */
  function initSlider() {
    const slider = $("#slider");
    if (!slider) return;
    const slides = $$(".slide", slider);
    const dotsWrap = $(".slider__dots", slider);
    if (!slides.length) return;

    let idx = 0, timer = null;

    // build dots
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Go to review " + (i + 1));
      b.addEventListener("click", () => { go(i); restart(); });
      dotsWrap.appendChild(b);
    });
    const dots = $$("button", dotsWrap);

    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, si) => s.classList.toggle("active", si === idx));
      dots.forEach((d, di) => d.classList.toggle("active", di === idx));
    }
    function next() { go(idx + 1); }
    function prev() { go(idx - 1); }
    function start() { if (!reduceMotion) timer = setInterval(next, 5500); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    $(".slider__arrow.next", slider).addEventListener("click", () => { next(); restart(); });
    $(".slider__arrow.prev", slider).addEventListener("click", () => { prev(); restart(); });
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);

    // swipe
    let x0 = null;
    slider.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); restart(); }
      x0 = null;
    });

    go(0);
    start();
  }

  /* -----------------------------------------------------
     11. GALLERY LIGHTBOX
  ----------------------------------------------------- */
  function initGallery() {
    const gallery = $("#gallery");
    const box = $("#lightbox");
    if (!gallery || !box) return;

    const imgEl = $("img", box);
    const triggers = $$("button", gallery);
    const sources = triggers.map((t) => t.dataset.full || t.querySelector("img").src);
    let cur = 0;
    let lastFocus = null;
    const lightboxFocusables = () => $$("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", box)
      .filter((el) => !el.disabled && !el.hidden);

    function open(i) {
      if (!box.classList.contains("open")) lastFocus = document.activeElement;
      cur = (i + sources.length) % sources.length;
      applyImageMeta(imgEl, sources[cur], "Gallery image enlarged", {
        loading: "lazy",
        sizes: "92vw"
      });
      box.classList.add("open");
      document.body.style.overflow = "hidden";
      $(".lightbox__close", box).focus();
    }
    function close() {
      box.classList.remove("open");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    triggers.forEach((t, i) => t.addEventListener("click", () => open(i)));
    $(".lightbox__close", box).addEventListener("click", close);
    $(".lightbox__nav.next", box).addEventListener("click", () => open(cur + 1));
    $(".lightbox__nav.prev", box).addEventListener("click", () => open(cur - 1));
    box.addEventListener("click", (e) => { if (e.target === box) close(); });
    document.addEventListener("keydown", (e) => {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") open(cur + 1);
      if (e.key === "ArrowLeft") open(cur - 1);
      if (e.key === "Tab") {
        const nodes = lightboxFocusables();
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* -----------------------------------------------------
     12. SUB-NAV (Gallery / Menu / Reservation) — fade/slide
  ----------------------------------------------------- */
  function initSubnav() {
    const tabs = $$(".subnav-tab");
    const views = $$(".subview");
    if (!tabs.length || !views.length) return;

    function select(view) {
      tabs.forEach((t) => {
        const on = t.dataset.view === view;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", String(on));
      });
      views.forEach((v) => v.classList.toggle("active", v.id === "view-" + view));

      const shown = $("#view-" + view);
      if (shown) {
        // Reveal any scroll-reveal items that were hidden while the view was closed.
        $$(".reveal", shown).forEach((el) => el.classList.add("in"));
      }
      // The mosaic needs a re-measure when it becomes visible again.
      if (view === "gallery" && window.SWGallery) window.SWGallery.relayout();
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => select(tab.dataset.view));
      tab.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const i = tabs.indexOf(tab);
        const next = e.key === "ArrowRight"
          ? tabs[(i + 1) % tabs.length]
          : tabs[(i - 1 + tabs.length) % tabs.length];
        next.focus();
        select(next.dataset.view);
      });
    });
  }

  /* -----------------------------------------------------
     INIT ALL
  ----------------------------------------------------- */
  // Each feature is started in isolation. Previously one throw — a canvas
  // that refused to give a context, a field left in an odd state by the
  // dashboard — would abort the whole handler and silently kill every
  // feature after it. Now a broken part costs only itself.
  function safe(name, fn) {
    try { fn(); }
    catch (err) { console.error("[Seven Wonders] " + name + " failed:", err); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe("nav", initNav);
    safe("cart", initCart);
    safe("embers", initEmbers);
    safe("menu tabs", initMenuTabs);
    safe("subnav", initSubnav);
    safe("reveal", initReveal);
    safe("calendar", initCalendar);
    safe("forms", initForms);
    safe("blog", initBlog);
    safe("menu of the day", initMenuOfDay);
    safe("slider", initSlider);
    safe("gallery", initGallery);
    safe("year", function () {
      const y = document.getElementById("year");
      if (y) y.textContent = new Date().getFullYear();
    });
  });
})();
