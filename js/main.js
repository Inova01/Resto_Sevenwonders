/* =========================================================
   SEVEN WONDERS — main.js  (vanilla, no dependencies)
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* -----------------------------------------------------
     1. MOBILE NAV DRAWER
  ----------------------------------------------------- */
  function initNav() {
    const burger   = $(".hamburger");
    const links    = $("#nav-links");
    const backdrop = $(".drawer-backdrop");
    if (!burger || !links) return;

    const setOpen = (open) => {
      burger.setAttribute("aria-expanded", String(open));
      links.classList.toggle("open", open);
      if (backdrop) backdrop.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };

    burger.addEventListener("click", () =>
      setOpen(burger.getAttribute("aria-expanded") !== "true")
    );
    if (backdrop) backdrop.addEventListener("click", () => setOpen(false));
    $$("a", links).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* -----------------------------------------------------
     2. CART (localStorage + badge pop)
  ----------------------------------------------------- */
  const CART_KEY = "sw_cart_count";

  function getCartCount() {
    return parseInt(localStorage.getItem(CART_KEY) || "0", 10) || 0;
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
  function initCart() {
    renderBadge(false);
    $$("[data-add-to-cart]").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem(CART_KEY, String(getCartCount() + 1));
        renderBadge(true);
        const original = btn.dataset.label || btn.textContent.trim();
        btn.dataset.label = original;
        btn.textContent = "✓ Added";
        setTimeout(() => { btn.textContent = original; }, 1200);
      });
    });
  }

  /* -----------------------------------------------------
     3. EMBER / FIRE CANVAS (homepage hero)
  ----------------------------------------------------- */
  function initEmbers() {
    const canvas = $("#ember-canvas");
    if (!canvas || reduceMotion) return;

    const ctx = canvas.getContext("2d");
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
        if (isPast) { b.disabled = true; b.style.opacity = ".35"; }
        b.setAttribute("aria-label", `${monthNames[viewMonth]} ${d}, ${viewYear}`);
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

        // If key not yet configured, simulate success gracefully.
        if (!key || key.includes("PLACEHOLDER")) {
          showStatus(status, "success",
            "Thank you! Your request has been received. (Demo mode — add your Web3Forms key to send real emails.)");
          form.reset();
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
     9. MENU OF THE DAY (old rotation style, real Haitian dishes)
  ----------------------------------------------------- */
  function initMenuOfDay() {
    const root = $("#mod");
    if (!root) return;

    const img = $("#mod-img", root);
    const dayEl = $("#mod-day", root);
    const nameEl = $("#mod-name", root);
    const descEl = $("#mod-desc", root);
    const priceEl = $("#mod-price", root);
    const body = $(".mod-body", root);
    const dots = $$(".mod-dots button", root);

    const pool = buildDailySpecialPool();
    if (!pool.length) return;

    const today = new Date();
    const todayIdx = today.getDay(); // 0=Sunday
    const weekDates = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(today);
      date.setDate(today.getDate() + dayIndex - todayIdx);
      return date;
    });
    const specials = weekDates.map((date) => ({
      date,
      day: date.toLocaleDateString("en-US", { weekday: "long" }),
      dish: pickDailySpecial(date, pool),
    }));

    function show(dayIndex, animate) {
      const special = specials[dayIndex];
      const dish = special.dish;

      dayEl.textContent = (dayIndex === todayIdx ? "Today \u00b7 " : "") + special.day;
      nameEl.textContent = dish.name;

      if (dish.desc) {
        descEl.textContent = dish.desc;
        descEl.hidden = false;
      } else {
        descEl.textContent = "";
        descEl.hidden = true;
      }

      priceEl.innerHTML = `${formatPrice(discountPrice(dish.price))} <small>${formatPrice(dish.price)}</small>`;

      if (img) {
        img.src = dish.photo;
        img.alt = `${dish.name} - menu of the day`;
      }

      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === dayIndex);
        dot.setAttribute("aria-selected", String(index === dayIndex));
        dot.setAttribute("aria-label", specials[index].day);
      });

      if (animate && !reduceMotion) {
        img.classList.remove("swap");
        body.classList.remove("swap");
        void body.offsetWidth;
        img.classList.add("swap");
        body.classList.add("swap");
        setTimeout(() => img.classList.remove("swap"), 60);
      }
    }

    dots.forEach((dot, dayIndex) => dot.addEventListener("click", () => show(dayIndex, true)));
    show(todayIdx, false);
  }

  function buildDailySpecialPool() {
    const data = window.SW_MENU;
    if (!data || !Array.isArray(data.categories)) return [];

    return data.categories.flatMap((category) => {
      const isMealMainCategory = category.id === "lunch" || category.id === "dinner";
      const isSpecialNight = category.id === "special";
      if (!isMealMainCategory && !isSpecialNight) return [];

      return (category.subcats || []).flatMap((subcat) => {
        const isMainSubcat = /main dishes/i.test(subcat.label || "");
        if (isMealMainCategory && !isMainSubcat) return [];

        return (subcat.items || [])
          .filter((item) => isEligibleDailySpecial(item))
          .map((item) => ({
            id: item.id,
            name: item.name,
            desc: (item.desc || "").trim(),
            price: item.price,
            photo: item.photo || category.photo || "assets/gallery/gallery-07.jpeg",
            source: `${category.label} / ${subcat.label}`,
          }));
      });
    });
  }

  function isEligibleDailySpecial(item) {
    if (!item || typeof item.price !== "number" || !Number.isFinite(item.price)) return false;
    if (/tbd|variable/i.test(String(item.priceLabel || ""))) return false;
    if (/^side\b/i.test(item.name || "")) return false;
    return true;
  }

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function hashDateKey(key) {
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function rawSpecialIndex(date, poolLength) {
    return hashDateKey(localDateKey(date)) % poolLength;
  }

  function pickDailySpecial(date, pool) {
    const todayIndex = rawSpecialIndex(date, pool.length);
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIndex = rawSpecialIndex(yesterday, pool.length);
    const guardedIndex = todayIndex === yesterdayIndex ? (todayIndex + 1) % pool.length : todayIndex;
    return pool[guardedIndex];
  }

  function discountPrice(price) {
    return Math.round((price * 0.85) * 2) / 2;
  }

  function formatPrice(price) {
    return `$${price.toFixed(2)}`;
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

    function open(i) {
      cur = (i + sources.length) % sources.length;
      imgEl.src = sources[cur];
      box.classList.add("open");
      document.body.style.overflow = "hidden";
      $(".lightbox__close", box).focus();
    }
    function close() { box.classList.remove("open"); document.body.style.overflow = ""; }

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

    tabs.forEach((tab) =>
      tab.addEventListener("click", () => select(tab.dataset.view))
    );
  }

  /* -----------------------------------------------------
     INIT ALL
  ----------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initCart();
    initEmbers();
    initMenuTabs();
    initSubnav();
    initReveal();
    initCalendar();
    initForms();
    initBlog();
    initMenuOfDay();
    initSlider();
    initGallery();
    // stamp footer year
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  });
})();
