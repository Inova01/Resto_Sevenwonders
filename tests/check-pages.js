/* Renders each real page in jsdom, runs all of the site's scripts, and
   asserts what a visitor would actually see. */
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");
let fails = 0, passes = 0;
function ok(n) { passes++; console.log("  ok   " + n); }
function bad(n, d) { fails++; console.log("  FAIL " + n + (d ? "\n         " + d : "")); }
function check(n, c, d) { c ? ok(n) : bad(n, d); }

function loadPage(file, opts = {}) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message + (e.detail ? " :: " + e.detail : "")));
  vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));

  const dom = new JSDOM(html, {
    url: "http://localhost:8000/" + file + (opts.query || ""),
    runScripts: "dangerously",
    resources: undefined,          // don't fetch images/fonts
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(win) {
      win.matchMedia = (query) => ({
        matches:
          (!!opts.prefersDark && /prefers-color-scheme:\s*dark/i.test(query)) ||
          (!!opts.reducedMotion && /prefers-reduced-motion:\s*reduce/i.test(query)),
        addEventListener() {},
        removeEventListener() {}
      });
      win.requestAnimationFrame = () => 0;
      win.cancelAnimationFrame = () => {};
      win.__canvasContextCalls = 0;
      win.HTMLCanvasElement.prototype.getContext = () => {
        win.__canvasContextCalls++;
        return null;
      };
      win.scrollTo = () => {};
      win.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      if (opts.themeChoice) win.localStorage.setItem("sw_theme", opts.themeChoice);
      if (opts.draft) win.localStorage.setItem("sw_admin_draft_v1", JSON.stringify(opts.draft));
    }
  });

  // Inline the local <script src> files by hand: jsdom won't fetch them
  // off disk, and we want them to run in document order.
  const doc = dom.window.document;
  const scripts = Array.from(doc.querySelectorAll("script[src]"));
  scripts.forEach((s) => {
    const src = s.getAttribute("src");
    const abs = path.join(ROOT, src.replace(/\//g, path.sep));
    if (!fs.existsSync(abs)) { bad("script not found: " + src); return; }
    const inline = doc.createElement("script");
    inline.textContent = fs.readFileSync(abs, "utf8");
    s.parentNode.replaceChild(inline, s);
  });

  // The scripts we just injected replaced nodes after DOMContentLoaded had
  // already fired, so fire it once more for the listeners they registered.
  const ev = new dom.window.Event("DOMContentLoaded", { bubbles: true });
  dom.window.document.dispatchEvent(ev);

  return { dom, doc, win: dom.window, errors };
}

function text(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : null; }

/* jsdom counts <script> contents in body.textContent, so a negative
   assertion like "no 555-0199 anywhere" would match the source code of
   the scripts themselves. Strip them and read only what a guest sees. */
function visible(doc) {
  const c = doc.body.cloneNode(true);
  c.querySelectorAll("script, style, template").forEach(n => n.remove());
  c.querySelectorAll("[hidden]").forEach(n => n.remove());
  return c.textContent.replace(/\s+/g, " ").trim();
}

function checkRenderedImages(file) {
  const { doc, win, errors } = loadPage(file);
  check(file + " has no image-related script errors", errors.length === 0, errors.join("\n         "));
  const imgs = Array.from(doc.querySelectorAll("img"));
  const missingCore = imgs.filter(img =>
    !img.hasAttribute("width") || !img.hasAttribute("height") || !img.hasAttribute("loading"));
  check(file + " gives every rendered image width, height and loading",
    missingCore.length === 0,
    missingCore.map(img => img.outerHTML.slice(0, 140)).join(" | "));

  const notResponsive = imgs.filter(img => {
    const src = img.getAttribute("src") || "";
    if (!/^assets\//.test(src)) return false;
    if (!win.SW_IMAGE_META || !win.SW_IMAGE_META[src]) return false;
    return !img.hasAttribute("srcset") || !img.hasAttribute("sizes");
  });
  check(file + " uses generated responsive sources for asset images",
    notResponsive.length === 0,
    notResponsive.map(img => img.getAttribute("src")).join(", "));
}

const CSS_TEXT = fs.readFileSync(path.join(ROOT, "css", "style.css"), "utf8");
const ADMIN_CSS_TEXT = fs.readFileSync(path.join(ROOT, "css", "admin.css"), "utf8");
function firstBlockAfter(needle) {
  const start = CSS_TEXT.indexOf(needle);
  if (start === -1) return "";
  const open = CSS_TEXT.indexOf("{", start);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < CSS_TEXT.length; i++) {
    if (CSS_TEXT[i] === "{") depth++;
    else if (CSS_TEXT[i] === "}" && --depth === 0) return CSS_TEXT.slice(open + 1, i);
  }
  return "";
}
function props(block) {
  const out = {};
  block.replace(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi, (_, k, v) => { out[k] = v.trim(); return ""; });
  return out;
}
function resolveToken(name, maps, seen = new Set()) {
  if (seen.has(name)) return "";
  seen.add(name);
  const found = maps.find(m => m[name] != null);
  if (!found) return "";
  const val = found[name];
  const ref = /^var\(--([a-z0-9-]+)\)$/i.exec(val);
  return ref ? resolveToken(ref[1], maps, seen) : val;
}
function rgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
}
function contrast(a, b) {
  const ra = rgb(a), rb = rgb(b);
  if (!ra || !rb) return 0;
  const la = 0.2126 * ra[0] + 0.7152 * ra[1] + 0.0722 * ra[2];
  const lb = 0.2126 * rb[0] + 0.7152 * rb[1] + 0.0722 * rb[2];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ============ theme + static links ============ */
console.log("\n=== theme and portable links ===");
{
  const guestPages = ["index.html", "about.html", "menu.html", "shop.html", "blog.html", "contact.html", "reservation.html"];
  const allPages = guestPages.concat(["404.html"]);
  allPages.forEach(file => {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    check(file + " uses the bumped stylesheet",
      /css\/style\.css\?v=perf-cart-a11y/.test(html));
    check(file + " sets the theme before CSS loads",
      html.indexOf("sw_theme") !== -1 && html.indexOf("sw_theme") < html.indexOf("css/style.css"));
    check(file + " has no github.io absolute links",
      !/inova01\.github\.io\/Resto_Sevenwonders/i.test(html));
  });
  guestPages.forEach(file => {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    check(file + " has the day/night toggle", /data-theme-toggle/.test(html));
    check(file + " loads theme.js", /<script src="js\/theme\.js"><\/script>/.test(html));
  });

  const dark = loadPage("index.html", { prefersDark: true });
  check("system dark preference applies without a saved choice",
    dark.doc.documentElement.getAttribute("data-theme") === "dark");
  check("dark toggle announces the next action",
    dark.doc.querySelector("[data-theme-toggle]").getAttribute("aria-label") === "Switch to light theme");
  dark.doc.querySelector("[data-theme-toggle]").dispatchEvent(new dark.win.Event("click", { bubbles: true }));
  check("theme toggle persists an explicit choice",
    dark.win.localStorage.getItem("sw_theme") === "light" &&
    dark.doc.documentElement.getAttribute("data-theme") === "light");

  const lightOverride = loadPage("index.html", { prefersDark: true, themeChoice: "light" });
  check("saved light choice overrides system dark",
    lightOverride.doc.documentElement.getAttribute("data-theme") === "light");
  const darkChoice = loadPage("index.html", { themeChoice: "dark" });
  check("saved dark choice overrides system light",
    darkChoice.doc.documentElement.getAttribute("data-theme") === "dark");
  check("404 honors system dark before CSS",
    loadPage("404.html", { prefersDark: true }).doc.documentElement.getAttribute("data-theme") === "dark");

  const brand = props(firstBlockAfter(":root {"));
  const lightTokens = props(firstBlockAfter('[data-theme="light"]'));
  const darkTokens = props(firstBlockAfter('[data-theme="dark"]'));
  const token = (name, scope) => resolveToken(name, [scope, brand]);
  check("dark ground is black and ground-2 is warm charcoal",
    token("ground", darkTokens) === "#000000" &&
    token("ground-2", darkTokens) === "#1A1613" &&
    token("ground", darkTokens) !== token("ground-2", darkTokens));
  check("light accent clears AA on light secondary ground",
    contrast(token("accent", lightTokens), token("ground-2", lightTokens)) >= 4.5,
    contrast(token("accent", lightTokens), token("ground-2", lightTokens)).toFixed(2));
  check("dark accent clears AA on black",
    contrast(token("accent", darkTokens), token("ground", darkTokens)) >= 4.5,
    contrast(token("accent", darkTokens), token("ground", darkTokens)).toFixed(2));
  check("dark body text clears AA on black",
    contrast(token("ink", darkTokens), token("ground", darkTokens)) >= 4.5,
    contrast(token("ink", darkTokens), token("ground", darkTokens)).toFixed(2));
  check("dark muted text clears AA on warm charcoal",
    contrast(token("ink-muted", darkTokens), token("ground-2", darkTokens)) >= 4.5,
    contrast(token("ink-muted", darkTokens), token("ground-2", darkTokens)).toFixed(2));
}

/* ============ image performance + reduced motion ============ */
console.log("\n=== image performance and reduced motion ===");
{
  ["index.html", "about.html", "menu.html", "shop.html", "blog.html", "contact.html", "reservation.html"]
    .forEach(checkRenderedImages);

  const home = loadPage("index.html");
  const hero = home.doc.querySelector(".hero__bg");
  check("homepage hero image is eager and high priority",
    hero.getAttribute("loading") === "eager" && hero.getAttribute("fetchpriority") === "high",
    hero.outerHTML.slice(0, 180));
  check("homepage ember canvas initializes when motion is allowed",
    home.win.__canvasContextCalls > 0,
    String(home.win.__canvasContextCalls));

  const reducedLight = loadPage("index.html", { reducedMotion: true, themeChoice: "light" });
  check("reduced motion skips the ember canvas in light theme",
    reducedLight.win.__canvasContextCalls === 0,
    String(reducedLight.win.__canvasContextCalls));
  check("reduced motion reveals content immediately in light theme",
    Array.from(reducedLight.doc.querySelectorAll(".reveal")).every(el => el.classList.contains("in")));

  const reducedDark = loadPage("index.html", { reducedMotion: true, themeChoice: "dark" });
  check("reduced motion skips the ember canvas in dark theme",
    reducedDark.win.__canvasContextCalls === 0,
    String(reducedDark.win.__canvasContextCalls));
  check("reduced motion reveals content immediately in dark theme",
    Array.from(reducedDark.doc.querySelectorAll(".reveal")).every(el => el.classList.contains("in")));
}

/* ============ index.html ============ */
console.log("\n=== index.html ===");
{
  const { doc, win, errors } = loadPage("index.html");
  const SWMENU_NAMES = [];
  win.SW.eachMenuItem(i => SWMENU_NAMES.push(i.name));
  check("no script errors", errors.length === 0, errors.join("\n         "));

  const footerVisit = Array.from(doc.querySelectorAll(".site-footer li")).map(text);
  check("footer shows the real street", footerVisit.some(t => /2145 University Blvd N/.test(t)),
    footerVisit.join(" | "));
  check("footer shows the real phone", footerVisit.some(t => /904 402 9212/.test(t)));
  check("footer no longer shows the invented address",
    !footerVisit.some(t => /Riverside|555-0199/.test(t)));
  check("hours are collapsed into ranges",
    footerVisit.some(t => /Mon – Thu · 8 AM – 9 PM/.test(t)), footerVisit.join(" | "));
  check("no dead social links",
    doc.querySelectorAll('.site-footer .socials a[href="#"]').length === 0);
  check("footer socials hidden entirely while no links are set",
    doc.querySelectorAll(".site-footer .socials").length === 0);

  const dishes = Array.from(doc.querySelectorAll(".dish-grid .dish-card"));
  check("3 featured dishes rendered", dishes.length === 3, "got " + dishes.length);
  check("featured dish 1 is the Fish Platter", /Fish Platter/.test(text(dishes[0])), text(dishes[0]));
  check("featured prices come from the menu", /\$28\.00/.test(text(dishes[0])), text(dishes[0]));

  const gal = doc.querySelectorAll("#gallery button");
  check("homepage gallery has 7 tiles", gal.length === 7, "got " + gal.length);
  check("gallery tile 1 is wide", gal[0].className === "wide");
  check("gallery tile 2 is tall", gal[1].className === "tall");
  check("gallery uses local photos, not Unsplash",
    Array.from(gal).every(b => /^assets\/gallery\//.test(b.getAttribute("data-full"))));

  const events = doc.querySelector(".events-grid");
  check("events section is hidden when nothing is upcoming",
    events.closest(".section").hidden === true);
  check("no stale July dates anywhere", !/Jul 1[123]/.test(visible(doc)));

  const slider = doc.querySelector("#slider");
  check("reviews section hidden while there are no real reviews",
    slider.closest(".section").hidden === true);
  check("invented guest quotes are gone", !/wagyu|seven-course tasting/i.test(visible(doc)));

  const posts = Array.from(doc.querySelectorAll(".blog-grid .post-card"));
  check("3 blog cards on the homepage", posts.length === 3, "got " + posts.length);
  check("newest post first", /Patte Kòde/.test(text(posts[0])), text(posts[0]));
  check("homepage blog links point at blog.html",
    posts.every(p => /^blog\.html#post-/.test(p.querySelector("h3 a").getAttribute("href"))));

  const modName = text(doc.querySelector("#mod-name"));
  const modPrice = text(doc.querySelector("#mod-price"));
  const modDay = text(doc.querySelector("#mod-day"));
  check("menu of the day ran (weekday stamped by JS, not in the HTML)",
    /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(modDay), modDay);
  check("footer shows the current year", new RegExp(String(new Date().getFullYear())).test(text(doc.querySelector(".footer-bottom"))), text(doc.querySelector(".footer-bottom")));
  check("menu of the day picked a real dish",
    !!modName && !!SWMENU_NAMES && SWMENU_NAMES.indexOf(modName) !== -1, modName);
  check("menu of the day shows a discounted price", /^\$\d+\.\d\d/.test(modPrice), modPrice);
  check("menu of the day photo is a local file",
    /^assets\//.test(doc.querySelector("#mod-img").getAttribute("src")));

  check("nav has 6 items, no duplicates", doc.querySelectorAll("#nav-links li").length === 6);
  check("exactly one aria-current in the page",
    doc.querySelectorAll('[aria-current="page"]').length === 1);
  check("no preview bar for a normal visitor", !doc.querySelector(".sw-preview-bar"));
}

/* ============ shop.html ============ */
console.log("\n=== shop.html ===");
{
  const { doc, errors } = loadPage("shop.html");
  check("no script errors", errors.length === 0, errors.join("\n         "));
  const cards = Array.from(doc.querySelectorAll(".product-card"));
  check("10 products rendered", cards.length === 10, "got " + cards.length);
  check("count line matches the grid", text(doc.querySelector(".results")) === "Showing 10 products",
    text(doc.querySelector(".results")));
  check("the wrong '1–9 of 16' line is gone", !/of 16/.test(visible(doc)));
  check("no fake Sale! badges", doc.querySelectorAll(".sale-badge").length === 0);
  check("prices are the real menu prices", /\$16\.99/.test(visible(doc)));
  check("invented products are gone", !/Wagyu|Soufflé|Scallops/i.test(visible(doc)));
  check("add-to-cart buttons are wired", cards.every(c => c.querySelector("[data-add-to-cart]")));
  check("blank payment links keep the regular cart flow",
    doc.querySelectorAll("[data-payment-link]").length === 0);
  const sortOpts = Array.from(doc.querySelectorAll("#sort option")).map(o => o.textContent);
  check("sort dropdown only offers implemented options",
    !sortOpts.some(o => /popularity|latest/i.test(o)), sortOpts.join(", "));
}

/* ============ blog.html ============ */
console.log("\n=== blog.html ===");
{
  const { doc, errors } = loadPage("blog.html");
  check("no script errors", errors.length === 0, errors.join("\n         "));
  check("6 post cards", doc.querySelectorAll("#blog-list .post-card").length === 6);
  check("6 full posts built", doc.querySelectorAll("#blog-detail .post-full").length === 6);
  check("post bodies rendered as paragraphs",
    doc.querySelectorAll("#blog-detail .post-full p").length >= 18);
  check("fine-dining fiction is gone", !/soufflé|sommelier|day-boat/i.test(visible(doc)));
  check("detail view starts hidden", doc.querySelector("#blog-detail").style.display === "none");
}
console.log("\n=== blog.html#post-… (deep link from the homepage) ===");
{
  const html = fs.readFileSync(path.join(ROOT, "blog.html"), "utf8");
  const { doc, errors } = (() => {
    const saved = loadPage("blog.html");
    return saved;
  })();
  // simulate arriving with a hash by re-loading with one
  const dom = new JSDOM(html, {
    url: "http://localhost:8000/blog.html#post-what-goes-into-griot",
    runScripts: "dangerously", pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    beforeParse(win) {
      win.matchMedia = () => ({ matches: false });
      win.scrollTo = () => {};
    }
  });
  const d = dom.window.document;
  Array.from(d.querySelectorAll("script[src]")).forEach((s) => {
    const abs = path.join(ROOT, s.getAttribute("src").replace(/\//g, path.sep));
    const inline = d.createElement("script");
    inline.textContent = fs.readFileSync(abs, "utf8");
    s.parentNode.replaceChild(inline, s);
  });
  d.dispatchEvent(new dom.window.Event("DOMContentLoaded", { bubbles: true }));
  check("deep link opens the right post",
    d.querySelector("#post-what-goes-into-griot").classList.contains("active"));
  check("deep link hides the list", d.querySelector("#blog-list").style.display === "none");
}

/* ============ contact.html ============ */
console.log("\n=== contact.html ===");
{
  const { doc, errors } = loadPage("contact.html");
  check("no script errors", errors.length === 0, errors.join("\n         "));
  const info = text(doc.querySelector(".contact-info"));
  check("real address shown", /2145 University Blvd N/.test(info), info);
  check("no invented email row", !/hello@sevenwonders/.test(info));
  check("hours listed", /Mon – Thu/.test(info), info);
  const map = doc.querySelector(".map-embed iframe").getAttribute("src");
  check("map points at the real address", /University(\+|%20)Blvd/.test(decodeURIComponent(map)) || /University\+?%?20?Blvd/.test(map), map);
  const key = doc.querySelector('[name="access_key"]').value;
  check("no PLACEHOLDER key left in the form", key.indexOf("PLACEHOLDER") === -1, key);
  const status = text(doc.querySelector(".form-status"));
  check("form says it is not connected instead of faking success",
    /not switched on/i.test(status) && /904 402 9212/.test(status), status);
  check("warning is styled as a warning",
    doc.querySelector(".form-status").className.indexOf("warn") !== -1);
}

/* ============ about.html ============ */
console.log("\n=== about.html ===");
{
  const { doc, win, errors } = loadPage("about.html");
  check("no script errors", errors.length === 0, errors.join("\n         "));

  const story = text(doc.querySelector("[data-about-intro]"));
  check("the founding story is rendered from content/about.js",
    /November 24, 2018/.test(story) && /Oswald Gaboyau/.test(story), story.slice(0, 90));

  const founders = Array.from(doc.querySelectorAll("[data-about-founders] .founder-card"));
  check("both founder cards rendered", founders.length === 2, "got " + founders.length);
  check("founder portraits are local files",
    founders.every(c => /^assets\/restaurant\//.test(c.querySelector("img").getAttribute("src"))));
  check("founder portraits have real alt text",
    founders.every(c => /Gaboyau/.test(c.querySelector("img").getAttribute("alt"))));

  const photos = Array.from(doc.querySelectorAll("[data-about-photos] img"));
  check("the restaurant photo stack rendered", photos.length === 2, "got " + photos.length);

  const detail = text(doc.querySelector("[data-about-detail]"));
  check("the rest of the story is rendered", /more than 200 weddings/.test(detail));
  check("the closing line is bold, not a paragraph",
    /Freshly Baked Daily/.test(text(doc.querySelector("[data-about-detail] strong"))));

  /* The whole point of moving this page into content/: the address is
     printed once, in settings, and the About page follows it. */
  const visit = text(doc.querySelector("[data-about-visit]"));
  check("visit block takes the address from settings",
    /2145 University Blvd N/.test(visit) && /904 402 9212/.test(visit), visit);
  check("visit block has both buttons",
    doc.querySelectorAll("[data-about-visit] .hero__cta a").length === 2);

  check("nav marks About as the current page",
    doc.querySelectorAll('[aria-current="page"]').length === 1 &&
    doc.querySelector('[aria-current="page"]').getAttribute("href") === "about.html");
  check("footer rendered from settings", /University Blvd/.test(text(doc.querySelector(".site-footer"))));
  check("no invented phone anywhere", !/555-0199/.test(visible(doc)));

  /* An empty founders list must remove the block, not leave a gap. */
  const draft = JSON.parse(JSON.stringify(win.SW.published));
  draft.about.founders.people = [];
  const empty = loadPage("about.html", { query: "?preview=1", draft });
  check("no founders means no empty column",
    empty.doc.querySelectorAll("[data-about-founders]").length === 0);
}

/* ============ reservation.html ============ */
console.log("\n=== reservation.html ===");
{
  const { doc, errors } = loadPage("reservation.html");
  check("no script errors", errors.length === 0, errors.join("\n         "));
  check("widget injected", !!doc.querySelector("#calendar"));
  const lead = text(doc.querySelector(".reserve-lead"));
  check("lead uses the real phone", /904 402 9212/.test(lead), lead);
  check("no invented phone anywhere", !/555-0199/.test(visible(doc)));
  const days = Array.from(doc.querySelectorAll("#cal-days button")).filter(b => b.textContent);
  check("calendar rendered days", days.length >= 28, "got " + days.length);
  check("no day is marked closed (nothing is closed in settings)",
    doc.querySelectorAll("#cal-days button.closed").length === 0);
  check("the closed-days note is omitted when nothing is closed",
    !/We are closed/.test(visible(doc)));
}

/* ============ menu.html ============ */
console.log("\n=== menu.html ===");
{
  const { doc, errors } = loadPage("menu.html");
  check("no script errors", errors.length === 0, errors.join("\n         "));
  const cats = Array.from(doc.querySelectorAll("#menu-cats button")).map(text);
  check("4 menu categories", cats.length === 4, cats.join(", "));
  check("categories are the real ones",
    cats.join("|") === "Breakfast|Lunch|Dinner|Special Menu Night", cats.join("|"));
  /* The mosaic pages 12 photos at a time. What matters here is that a
     page is drawn and that the two hidden founder portraits — which
     belong to the About page, not to a lightbox of food — stay out. */
  const tiles = Array.from(doc.querySelectorAll("#mgal .mgal-tile"));
  check("mosaic gallery draws a full page of photos", tiles.length === 12, "got " + tiles.length);
  check("hidden photos are kept out of the gallery",
    !/oswald-gaboyau|marjorie-gaboyau/.test(doc.querySelector("#mgal").innerHTML));
  check("order builder present", !!doc.querySelector("#order-form"));
  check("reservation widget also on this page", !!doc.querySelector("#calendar"));
  const board = Array.from(doc.querySelectorAll(".menu-board-card img"));
  check("printed menu board shows both photos", board.length === 2, "got " + board.length);
  check("menu board photos are the real scans",
    board.every(i => /^assets\/menu\/menu-[12]\.jpeg$/.test(i.getAttribute("src"))),
    board.map(i => i.getAttribute("src")).join(", "));
}

/* ============ draft preview ============ */
console.log("\n=== preview mode (?preview=1 with a draft) ===");
{
  const draft = {
    settings: { contact: { address1: "DRAFT STREET", address2: "Draft City, FL", phone: "000 000 0000", phoneDigits: "+10000000000" } },
    shop: { products: [{ id: "d1", name: "Draft Dish", note: "", price: 9.5, sale: null, inStock: true, img: "", paymentLink: "https://buy.stripe.com/test_123" }] }
  };
  const { doc, errors } = loadPage("shop.html", { query: "?preview=1", draft });
  check("no script errors", errors.length === 0, errors.join("\n         "));
  check("preview bar is shown", !!doc.querySelector(".sw-preview-bar"));
  check("draft product replaces the published list",
    doc.querySelectorAll(".product-card").length === 1);
  check("draft product name is used", /Draft Dish/.test(visible(doc)));
  check("draft address reaches the footer", /DRAFT STREET/.test(visible(doc)));
  check("count line follows the draft",
    text(doc.querySelector(".results")) === "Showing 1 product",
    text(doc.querySelector(".results")));
  check("Stripe Payment Link renders as a checkout link",
    doc.querySelector("[data-payment-link]").getAttribute("href") === "https://buy.stripe.com/test_123");
  check("Stripe products still keep the regular cart button",
    !!doc.querySelector(".product-card [data-add-to-cart]"));
  check("Stripe checkout is presented as a separate single-item path",
    /combine items/i.test(text(doc.querySelector(".shop-pay-note"))));

  const plain = loadPage("shop.html", { draft });
  check("the same browser WITHOUT ?preview=1 sees the published site",
    plain.doc.querySelectorAll(".product-card").length === 10 &&
    !/DRAFT STREET/.test(visible(plain.doc)),
    plain.doc.querySelectorAll(".product-card").length + " products");

  const invalid = loadPage("shop.html", {
    query: "?preview=1",
    draft: { shop: { products: [{ id: "bad", name: "Bad Link", note: "", price: 1, sale: null, inStock: true, img: "", paymentLink: "javascript:alert(1)" }] } }
  });
  check("non-Stripe payment links are ignored",
    !invalid.doc.querySelector("[data-payment-link]") &&
    !!invalid.doc.querySelector("[data-add-to-cart]"));

  /* The two spoofs that defeat a naive host check: a lookalike suffix
     domain, and a host smuggled into the userinfo position. Both must
     fall back to the local cart rather than send a guest off-site. */
  [
    ["suffix-domain spoof", "https://buy.stripe.com.evil.example/x"],
    ["userinfo spoof",      "https://buy.stripe.com@evil.example/x"],
    ["protocol-relative",   "//buy.stripe.com/x"],
    ["plain http",          "http://buy.stripe.com/x"]
  ].forEach(([label, url]) => {
    const spoof = loadPage("shop.html", {
      query: "?preview=1",
      draft: { shop: { products: [{ id: "bad", name: "Bad Link", note: "", price: 1, sale: null, inStock: true, img: "", paymentLink: url }] } }
    });
    check("payment link rejected: " + label,
      !spoof.doc.querySelector("[data-payment-link]") &&
      !!spoof.doc.querySelector("[data-add-to-cart]"), url);
  });

  const mixed = loadPage("shop.html", {
    query: "?preview=1",
    draft: { shop: { products: [
      { id: "link", name: "Linked Dish", note: "", price: 9, sale: null, inStock: true, img: "", paymentLink: "https://buy.stripe.com/test_link" },
      { id: "cart", name: "Cart Dish", note: "", price: 10, sale: null, inStock: true, img: "", paymentLink: "" }
    ] } }
  });
  check("mixed Stripe/cart products all keep Add to cart",
    mixed.doc.querySelectorAll("[data-add-to-cart]").length === 2);
  check("mixed Stripe/cart products show only valid express links",
    mixed.doc.querySelectorAll("[data-payment-link]").length === 1);

  const allLinks = loadPage("shop.html", {
    query: "?preview=1",
    draft: { shop: { products: [
      { id: "a", name: "Dish A", note: "", price: 9, sale: null, inStock: true, img: "", paymentLink: "https://buy.stripe.com/test_a" },
      { id: "b", name: "Dish B", note: "", price: 10, sale: null, inStock: true, img: "", paymentLink: "https://buy.stripe.com/test_b" }
    ] } }
  });
  check("all-Stripe products still support cart combining",
    allLinks.doc.querySelectorAll("[data-add-to-cart]").length === 2 &&
    allLinks.doc.querySelectorAll("[data-payment-link]").length === 2);
}

/* ============ keyboard accessibility ============ */
console.log("\n=== keyboard accessibility ===");
{
  const { doc, win, errors } = loadPage("index.html");
  check("no script errors", errors.length === 0, errors.join("\n         "));

  const burger = doc.querySelector(".hamburger");
  burger.dispatchEvent(new win.Event("click", { bubbles: true }));
  check("mobile nav opens from the hamburger",
    burger.getAttribute("aria-expanded") === "true" &&
    doc.querySelector("#nav-links").classList.contains("open"));
  check("mobile nav moves focus into the drawer",
    doc.activeElement === doc.querySelector("#nav-links a"));
  const navFocusables = [burger].concat(Array.from(doc.querySelectorAll("#nav-links a")));
  navFocusables[navFocusables.length - 1].focus();
  doc.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
  check("mobile nav traps Tab back to the hamburger",
    doc.activeElement === burger);
  doc.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("Escape closes the mobile nav and restores focus",
    burger.getAttribute("aria-expanded") === "false" && doc.activeElement === burger);

  const homeTile = doc.querySelector("#gallery button");
  homeTile.focus();
  homeTile.dispatchEvent(new win.Event("click", { bubbles: true }));
  const lb = doc.querySelector("#lightbox");
  check("homepage lightbox opens and focuses close",
    lb.classList.contains("open") && doc.activeElement === doc.querySelector(".lightbox__close"));
  doc.querySelector(".lightbox__nav.next").focus();
  doc.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
  check("homepage lightbox traps Tab",
    doc.activeElement === doc.querySelector(".lightbox__close"));
  doc.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("homepage lightbox Escape closes and returns focus",
    !lb.classList.contains("open") && doc.activeElement === homeTile);

  const menuPage = loadPage("menu.html");
  const subnav = Array.from(menuPage.doc.querySelectorAll(".subnav-tab"));
  subnav[0].focus();
  subnav[0].dispatchEvent(new menuPage.win.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  check("menu subnav supports arrow-key tabs",
    subnav[1].classList.contains("active") && menuPage.doc.activeElement === subnav[1]);

  const cats = Array.from(menuPage.doc.querySelectorAll("#menu-cats button"));
  cats[0].focus();
  cats[0].dispatchEvent(new menuPage.win.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  const freshCats = Array.from(menuPage.doc.querySelectorAll("#menu-cats button"));
  check("menu category tabs support arrow keys",
    freshCats[1].getAttribute("aria-selected") === "true" && menuPage.doc.activeElement === freshCats[1]);

  const galleryTile = menuPage.doc.querySelector("#mgal .mgal-tile");
  galleryTile.focus();
  galleryTile.dispatchEvent(new menuPage.win.Event("click", { bubbles: true }));
  const glb = menuPage.doc.querySelector("#mgal-lightbox");
  check("mosaic lightbox opens and focuses close",
    glb.classList.contains("open") && menuPage.doc.activeElement === menuPage.doc.querySelector(".mgal-lb__close"));
  menuPage.doc.querySelector(".mgal-lb__nav.next").focus();
  menuPage.doc.dispatchEvent(new menuPage.win.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
  check("mosaic lightbox traps Tab",
    menuPage.doc.activeElement === menuPage.doc.querySelector(".mgal-lb__close"));
  menuPage.doc.dispatchEvent(new menuPage.win.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("mosaic lightbox Escape closes and returns focus",
    !glb.classList.contains("open") && menuPage.doc.activeElement === galleryTile);

  check("calendar day buttons expose useful labels",
    !!menuPage.doc.querySelector("#cal-days button[aria-label*=', 2026']"));
  check("order builder controls remain keyboard-reachable form controls",
    menuPage.doc.querySelectorAll("#order-form input[type='radio']").length > 0 &&
    menuPage.doc.querySelectorAll("#order-form button").length > 0);
}

/* ============ admin.html ============ */
console.log("\n=== admin.html ===");
{
  const adminHtml = fs.readFileSync(path.join(ROOT, "admin.html"), "utf8");
  const { doc, win, errors } = loadPage("admin.html");
  check("no script errors", errors.length === 0, errors.join("\n         "));
  check("dashboard uses the bumped readable stylesheet",
    /css\/admin\.css\?v=dashboard-readable/.test(adminHtml));
  check("dashboard uses the full screen instead of a capped half-width layout",
    /\.main\s*\{[\s\S]*max-width:\s*none/.test(ADMIN_CSS_TEXT) &&
    !/\.main\s*\{[^}]*max-width:\s*1080px/.test(ADMIN_CSS_TEXT));
  check("dashboard base font is larger for managers",
    /font-size:\s*clamp\(17px/.test(ADMIN_CSS_TEXT));
  check("dashboard sidebar is wider",
    /--sidebar:\s*clamp\(280px,\s*18vw,\s*340px\)/.test(ADMIN_CSS_TEXT));
  check("dashboard shell is visible (no PIN set)", doc.querySelector("#shell").hidden === false);
  check("gate stays hidden", doc.querySelector("#gate").hidden === true);

  const nav = Array.from(doc.querySelectorAll("#nav .side__link span:first-child")).map(text);
  check("all 10 sections in the sidebar", nav.length === 10, nav.join(", "));
  check("sidebar names the manager's tasks",
    nav.join("|").indexOf("Menu & prices") !== -1 && nav.join("|").indexOf("Info & hours") !== -1,
    nav.join("|"));

  const counts = Array.from(doc.querySelectorAll("#nav .count")).map(text);
  check("menu count = 28 dishes + 23 drinks = 51", counts[1] === "51", counts.join(","));
  check("gallery count is 58", counts[3] === "58", counts.join(","));
  check("shop count is 10", counts[2] === "10");
  check("blog count is 6", counts[4] === "6");
  check("publish badge empty when nothing has changed", counts[8] === "");

  const body = doc.querySelector("#view").textContent;
  check("overview warns that forms are not connected", /not reaching you/i.test(body));
  check("overview warns publishing is not connected", /Publishing is not connected/i.test(body));
  check("overview is honest about the page being public", /Anyone who knows this address/i.test(body));
  check("overview lists details still to confirm", /Details to confirm/.test(body));
  check("email/hours/socials flagged unconfirmed",
    /Email address/.test(body) && /Opening hours/.test(body) && /Social media links/.test(body));
  check("stat tiles present", doc.querySelectorAll(".tile").length === 6);
  check("action bar says everything is published",
    /Everything is published/.test(doc.querySelector(".actionbar").textContent));
  check("preview link points at the site with ?preview=1",
    !!doc.querySelector('a[href="index.html?preview=1"]'));
  check("photo picker modal exists", !!doc.querySelector("#photo-modal"));
  check("store exposes 3 publishers", win.SWStore.publishers.length === 3);
  check("github publisher is not configured out of the box",
    win.SWStore.get("github").isConfigured() === false);
  check("download publisher always works",
    win.SWStore.get("download").isConfigured() === true);

  Array.from(doc.querySelectorAll("#nav .side__link"))
    .find(l => /Shop/.test(l.textContent))
    .dispatchEvent(new win.Event("click", { bubbles: true }));
  check("shop editor exposes Stripe Payment Link fields",
    /Stripe Payment Link/.test(doc.querySelector("#view").textContent) &&
    !!doc.querySelector('#view input[type="url"][placeholder="https://buy.stripe.com/..."]'));
}

/* ============ every section of the dashboard renders ============ */
console.log("\n=== dashboard: every screen renders ===");
{
  const { doc, win, errors } = loadPage("admin.html");
  const links = Array.from(doc.querySelectorAll("#nav .side__link"));
  links.forEach((link) => {
    const name = text(link.querySelector("span"));
    const before = errors.length;
    link.dispatchEvent(new win.Event("click", { bubbles: true }));
    const rendered = doc.querySelector("#view").textContent.trim();
    check("screen renders: " + name,
      rendered.length > 40 && errors.length === before && !/could not be drawn/i.test(rendered),
      errors.slice(before).join(" | ") || rendered.slice(0, 80));
  });
}

/* ============ editing through the dashboard ============ */
console.log("\n=== dashboard: an edit becomes a publishable file ===");
{
  const { doc, win, errors } = loadPage("admin.html");
  // Go to Menu & prices
  Array.from(doc.querySelectorAll("#nav .side__link"))
    .find(l => /Menu & prices/.test(l.textContent))
    .dispatchEvent(new win.Event("click", { bubbles: true }));

  // Change the first price field we can find
  const priceInput = Array.from(doc.querySelectorAll("#view input[inputmode='decimal']"))[0];
  check("a price field is on screen", !!priceInput);
  priceInput.value = "19.99";
  priceInput.dispatchEvent(new win.Event("input", { bubbles: true }));

  const draft = JSON.parse(win.localStorage.getItem("sw_admin_draft_v1"));
  check("the edit was saved to the draft immediately", !!draft);
  const changed = win.SWStore.Draft.changedSections(draft, win.SW.published);
  check("only the menu is reported as changed",
    changed.length === 1 && changed[0] === "menu", JSON.stringify(changed));

  const files = win.SWStore.Serializer.filesFor(draft, win.SW.published);
  check("one file queued: content/menu.js",
    files.length === 1 && files[0].path === "content/menu.js");
  check("the new price is in the generated file", /19\.99/.test(files[0].text));
  check("the generated file is valid JavaScript", (() => {
    try { new win.Function(files[0].text); return true; } catch (e) { return false; }
  })());

  // Publish screen should now offer it
  Array.from(doc.querySelectorAll("#nav .side__link"))
    .find(l => /Publish/.test(l.textContent))
    .dispatchEvent(new win.Event("click", { bubbles: true }));
  const pub = doc.querySelector("#view").textContent;
  check("publish screen lists the change", /Menu, prices and the daily special/.test(pub));
  check("publish screen shows the file path", /content\/menu\.js/.test(pub));
  check("publish is blocked until a method is connected",
    Array.from(doc.querySelectorAll("#view button")).some(b => /Publish now/.test(b.textContent) && b.disabled));
  check("no script errors while editing", errors.length === 0, errors.join("\n         "));
}

console.log("\n=== dashboard: a Stripe Payment Link becomes a publishable file ===");
{
  const { doc, win, errors } = loadPage("admin.html");
  Array.from(doc.querySelectorAll("#nav .side__link"))
    .find(l => /Shop/.test(l.textContent))
    .dispatchEvent(new win.Event("click", { bubbles: true }));

  const linkInput = doc.querySelector('#view input[type="url"][placeholder="https://buy.stripe.com/..."]');
  check("a Stripe Payment Link field is on screen", !!linkInput);
  linkInput.value = "https://buy.stripe.com/test_abc123";
  linkInput.dispatchEvent(new win.Event("input", { bubbles: true }));

  const draft = JSON.parse(win.localStorage.getItem("sw_admin_draft_v1"));
  const changed = win.SWStore.Draft.changedSections(draft, win.SW.published);
  check("only the shop is reported as changed",
    changed.length === 1 && changed[0] === "shop", JSON.stringify(changed));

  const files = win.SWStore.Serializer.filesFor(draft, win.SW.published);
  check("one file queued: content/shop.js",
    files.length === 1 && files[0].path === "content/shop.js");
  check("the Stripe Payment Link is in the generated file",
    /https:\/\/buy\.stripe\.com\/test_abc123/.test(files[0].text));
  check("the generated shop file is valid JavaScript", (() => {
    try { new win.Function(files[0].text); return true; } catch (e) { return false; }
  })());
  check("no script errors while editing Stripe links", errors.length === 0, errors.join("\n         "));
}

console.log("\n" + "=".repeat(52));
console.log(fails === 0 ? `ALL ${passes} CHECKS PASSED` : `${fails} FAILED, ${passes} passed`);
process.exit(fails === 0 ? 0 : 1);
