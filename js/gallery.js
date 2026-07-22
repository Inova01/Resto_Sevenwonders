/* =========================================================
   SEVEN WONDERS - gallery.js  (mosaic gallery + lightbox)
   Vanilla, no dependencies.

   HOW TO ADD PHOTOS:
   1. Drop the image file into  assets/gallery/
   2. Add one line to the GALLERY_IMAGES array below.
   The gallery, pagination and lightbox rebuild themselves.
   ========================================================= */
(function () {
  "use strict";

  /* -----------------------------------------------------
     IMAGE MANIFEST  - add new photos here (one line each)
  ----------------------------------------------------- */
  const GALLERY_IMAGES = [
    "assets/restaurant/seven-wonders-exterior.jpeg",
    "assets/restaurant/seven-wonders-dining-room-front.jpeg",
    "assets/restaurant/seven-wonders-dining-room-art.jpeg",
    "assets/restaurant/oswald-gaboyau.jpeg",
    "assets/restaurant/marjorie-gaboyau.jpeg",
    "assets/gallery/gallery-01.jpeg",
    "assets/gallery/gallery-02.jpeg",
    "assets/gallery/gallery-03.jpeg",
    "assets/gallery/gallery-04.jpeg",
    "assets/gallery/gallery-05.jpeg",
    "assets/gallery/gallery-06.jpeg",
    "assets/gallery/gallery-07.jpeg",
    "assets/gallery/gallery-08.jpeg",
    "assets/gallery/gallery-09.jpeg",
    "assets/gallery/gallery-10.jpeg",
    "assets/gallery/gallery-11.jpeg",
    "assets/gallery/gallery-12.jpeg",
    "assets/gallery/gallery-13.jpeg",
    "assets/gallery/gallery-14.jpeg",
    "assets/gallery/gallery-15.jpeg",
    "assets/gallery/gallery-16.jpeg",
    "assets/gallery/gallery-17.jpeg",
    "assets/gallery/gallery-18.jpeg",
    "assets/gallery/gallery-19.jpeg",
    "assets/gallery/gallery-20.jpeg",
    "assets/gallery/gallery-21.jpeg",
    "assets/gallery/gallery-22.jpeg",
    "assets/gallery/gallery-23.jpeg",
    "assets/gallery/gallery-24.jpeg",
    "assets/gallery/gallery-25.jpeg",
    "assets/gallery/gallery-26.jpeg",
    "assets/gallery/gallery-27.jpeg",
    "assets/gallery/gallery-28.jpeg",
    "assets/gallery/gallery-29.jpeg",
    "assets/gallery/gallery-30.jpeg",
    "assets/gallery/gallery-31.jpeg",
    "assets/gallery/gallery-32.jpeg",
    "assets/gallery/gallery-33.jpeg",
    "assets/gallery/gallery-34.jpeg",
    "assets/gallery/gallery-35.jpeg",
    "assets/gallery/gallery-36.jpeg",
    "assets/gallery/gallery-37.jpeg",
    "assets/gallery/gallery-38.jpeg",
    "assets/gallery/gallery-39.jpeg",
    "assets/gallery/gallery-40.jpeg",
    "assets/gallery/gallery-41.jpeg",
    "assets/gallery/gallery-42.jpeg",
    "assets/gallery/gallery-43.jpeg",
    "assets/gallery/gallery-44.jpeg",
    "assets/gallery/gallery-45.jpeg",
    "assets/gallery/gallery-46.jpeg",
    "assets/gallery/gallery-47.jpeg",
    "assets/gallery/gallery-48.jpeg",
    "assets/gallery/gallery-49.jpeg",
    "assets/gallery/gallery-50.jpeg",
    "assets/gallery/gallery-51.jpeg",
    "assets/gallery/gallery-52.jpeg",
    "assets/gallery/gallery-53.jpeg",
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (sel, ctx = document) => ctx.querySelector(sel);

  function initMosaicGallery() {
    const root = $("#mgal");
    if (!root || !GALLERY_IMAGES.length) return;

    const grid    = $(".mgal-grid", root);
    const prevBtn = $(".mgal-arrow.prev", root);
    const nextBtn = $(".mgal-arrow.next", root);
    const dotsEl  = $(".mgal-dots", root);

    // Lightbox
    const box       = $("#mgal-lightbox");
    const boxImg    = box ? $(".mgal-lb__img", box) : null;
    const boxCount  = box ? $(".mgal-lb__count", box) : null;

    let cols = 4, perPage = 12, page = 0;

    /* ---- responsive layout: columns + photos-per-page ---- */
    function computeLayout() {
      const w = window.innerWidth;
      if (w <= 620)      { cols = 2; perPage = 6;  }  // mobile: rows of 2
      else if (w <= 992) { cols = 3; perPage = 9;  }  // tablet: 3 x 3
      else               { cols = 4; perPage = 12; }  // desktop: 3 x 4
    }

    function pageCount() {
      return Math.max(1, Math.ceil(GALLERY_IMAGES.length / perPage));
    }

    /* Square base cells: match auto-row height to a column's width. */
    function sizeRows() {
      const styles = getComputedStyle(grid);
      const gap = parseFloat(styles.columnGap) || 0;
      const inner = grid.clientWidth;
      if (!inner) return;
      const rowH = (inner - gap * (cols - 1)) / cols;
      grid.style.setProperty("--mgal-cols", cols);
      grid.style.setProperty("--mgal-row", rowH + "px");
    }

    /* Designed mosaic: a few tiles span for a "not-a-plain-grid" feel.
       Mobile keeps clean rows of 2 (no spans). */
    function applySpan(tile, pos) {
      tile.classList.remove("span-wide", "span-tall");
      if (cols >= 4) {
        const m = pos % 6;
        if (m === 0) tile.classList.add("span-tall");
        else if (m === 3) tile.classList.add("span-wide");
      } else if (cols === 3) {
        if (pos % 5 === 0) tile.classList.add("span-tall");
      }
    }

    function makeTile(globalIndex, posInPage) {
      const src = GALLERY_IMAGES[globalIndex];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mgal-tile";
      btn.dataset.index = String(globalIndex);
      btn.setAttribute("aria-label", "Open photo " + (globalIndex + 1) + " of " + GALLERY_IMAGES.length);
      applySpan(btn, posInPage);
      const img = document.createElement("img");
      img.src = src;
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = "Seven Wonders gallery photo " + (globalIndex + 1);
      btn.appendChild(img);
      btn.addEventListener("click", () => openLightbox(globalIndex));
      return btn;
    }

    /* Preload current page + next page for snappy paging. */
    function preload(p) {
      const start = p * perPage;
      const end = Math.min(GALLERY_IMAGES.length, start + perPage * 2);
      for (let i = start; i < end; i++) {
        const im = new Image();
        im.src = GALLERY_IMAGES[i];
      }
    }

    function renderDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = "";
      const total = pageCount();
      for (let i = 0; i < total; i++) {
        const d = document.createElement("button");
        d.type = "button";
        d.className = "mgal-dot" + (i === page ? " active" : "");
        d.setAttribute("aria-label", "Go to page " + (i + 1));
        d.addEventListener("click", () => goTo(i));
        dotsEl.appendChild(d);
      }
    }

    function updateArrows() {
      const last = pageCount() - 1;
      if (prevBtn) prevBtn.disabled = page <= 0;
      if (nextBtn) nextBtn.disabled = page >= last;
    }

    function buildPage() {
      grid.innerHTML = "";
      const start = page * perPage;
      const slice = GALLERY_IMAGES.slice(start, start + perPage);
      slice.forEach((_, i) => {
        const tile = makeTile(start + i, i);
        grid.appendChild(tile);
        if (reduceMotion) {
          tile.classList.add("in");
        } else {
          tile.style.transitionDelay = i * 50 + "ms";
          requestAnimationFrame(() =>
            requestAnimationFrame(() => tile.classList.add("in"))
          );
        }
      });
      updateArrows();
      renderDots();
      preload(page);
    }

    function paint(animate) {
      sizeRows();
      const old = Array.from(grid.children);
      if (animate && !reduceMotion && old.length) {
        old.forEach((t) => {
          t.style.transitionDelay = "0ms";
          t.classList.remove("in");
          t.classList.add("leaving");
        });
        window.setTimeout(buildPage, 190);
      } else {
        buildPage();
      }
    }

    function goTo(p) {
      const last = pageCount() - 1;
      p = Math.max(0, Math.min(last, p));
      if (p === page) return;
      page = p;
      paint(true);
    }
    function next() { goTo(page + 1); }
    function prev() { goTo(page - 1); }

    if (nextBtn) nextBtn.addEventListener("click", next);
    if (prevBtn) prevBtn.addEventListener("click", prev);

    /* Swipe on the grid */
    let x0 = null, y0 = null;
    grid.addEventListener("touchstart", (e) => {
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    grid.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        dx < 0 ? next() : prev();
      }
      x0 = y0 = null;
    }, { passive: true });

    /* Keyboard paging when the gallery region is in view / focused */
    document.addEventListener("keydown", (e) => {
      if (box && box.classList.contains("open")) return; // lightbox owns keys
      if (!isGalleryVisible()) return;
      if (e.key === "ArrowRight") { next(); }
      else if (e.key === "ArrowLeft") { prev(); }
    });

    function isGalleryVisible() {
      return root.offsetParent !== null;
    }

    /* ---------------- Lightbox (all photos) ---------------- */
    let lbIndex = 0;
    function openLightbox(i) {
      if (!box || !boxImg) return;
      lbIndex = (i + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
      boxImg.src = GALLERY_IMAGES[lbIndex];
      boxImg.alt = "Seven Wonders gallery photo " + (lbIndex + 1);
      if (boxCount) boxCount.textContent = (lbIndex + 1) + " / " + GALLERY_IMAGES.length;
      box.classList.add("open");
      document.body.style.overflow = "hidden";
      const closeBtn = $(".mgal-lb__close", box);
      if (closeBtn) closeBtn.focus();
    }
    function closeLightbox() {
      if (!box) return;
      box.classList.remove("open");
      document.body.style.overflow = "";
    }
    function lbGo(delta) { openLightbox(lbIndex + delta); }

    if (box) {
      $(".mgal-lb__close", box).addEventListener("click", closeLightbox);
      $(".mgal-lb__nav.prev", box).addEventListener("click", () => lbGo(-1));
      $(".mgal-lb__nav.next", box).addEventListener("click", () => lbGo(1));
      box.addEventListener("click", (e) => { if (e.target === box) closeLightbox(); });
      document.addEventListener("keydown", (e) => {
        if (!box.classList.contains("open")) return;
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowRight") lbGo(1);
        else if (e.key === "ArrowLeft") lbGo(-1);
      });
      // swipe inside lightbox
      let lx = null;
      box.addEventListener("touchstart", (e) => { lx = e.touches[0].clientX; }, { passive: true });
      box.addEventListener("touchend", (e) => {
        if (lx === null) return;
        const dx = e.changedTouches[0].clientX - lx;
        if (Math.abs(dx) > 45) lbGo(dx < 0 ? 1 : -1);
        lx = null;
      }, { passive: true });
    }

    /* ---------------- Resize handling ---------------- */
    let rt = null;
    function onResize() {
      const prevPer = perPage;
      computeLayout();
      // keep the first visible photo roughly in view when perPage changes
      if (perPage !== prevPer) {
        const firstIdx = page * prevPer;
        page = Math.floor(firstIdx / perPage);
      }
      page = Math.min(page, pageCount() - 1);
      sizeRows();
      // reflow spans without the entrance animation
      buildPage();
    }
    window.addEventListener("resize", () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(onResize, 150);
    });

    // Expose a relayout hook for when the gallery tab becomes visible
    window.SWGallery = {
      relayout: function () { sizeRows(); }
    };

    /* ---------------- First paint ---------------- */
    computeLayout();
    // Grid may be measured at 0 width if hidden; retry on next frame.
    paint(false);
    requestAnimationFrame(() => { sizeRows(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMosaicGallery);
  } else {
    initMosaicGallery();
  }
})();
