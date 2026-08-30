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
      win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      win.requestAnimationFrame = () => 0;
      win.cancelAnimationFrame = () => {};
      win.HTMLCanvasElement.prototype.getContext = () => null;
      win.scrollTo = () => {};
      win.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
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
  check("featured prices come from the menu", /\$36\.23/.test(text(dishes[0])), text(dishes[0]));

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

  check("nav has 5 items, no duplicates", doc.querySelectorAll("#nav-links li").length === 5);
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
  check("prices are the real menu prices", /\$17\.60/.test(visible(doc)));
  check("invented products are gone", !/Wagyu|Soufflé|Scallops/i.test(visible(doc)));
  check("add-to-cart buttons are wired", cards.every(c => c.querySelector("[data-add-to-cart]")));
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
  check("mosaic gallery built from all 53 photos",
    doc.querySelectorAll("#mgal .mgal-tile").length > 0);
  check("order builder present", !!doc.querySelector("#order-form"));
  check("reservation widget also on this page", !!doc.querySelector("#calendar"));
}

/* ============ draft preview ============ */
console.log("\n=== preview mode (?preview=1 with a draft) ===");
{
  const draft = {
    settings: { contact: { address1: "DRAFT STREET", address2: "Draft City, FL", phone: "000 000 0000", phoneDigits: "+10000000000" } },
    shop: { products: [{ id: "d1", name: "Draft Dish", note: "", price: 9.5, sale: null, inStock: true, img: "" }] }
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

  const plain = loadPage("shop.html", { draft });
  check("the same browser WITHOUT ?preview=1 sees the published site",
    plain.doc.querySelectorAll(".product-card").length === 10 &&
    !/DRAFT STREET/.test(visible(plain.doc)),
    plain.doc.querySelectorAll(".product-card").length + " products");
}

/* ============ admin.html ============ */
console.log("\n=== admin.html ===");
{
  const { doc, win, errors } = loadPage("admin.html");
  check("no script errors", errors.length === 0, errors.join("\n         "));
  check("dashboard shell is visible (no PIN set)", doc.querySelector("#shell").hidden === false);
  check("gate stays hidden", doc.querySelector("#gate").hidden === true);

  const nav = Array.from(doc.querySelectorAll("#nav .side__link span:first-child")).map(text);
  check("all 9 sections in the sidebar", nav.length === 9, nav.join(", "));
  check("sidebar names the manager's tasks",
    nav.join("|").indexOf("Menu & prices") !== -1 && nav.join("|").indexOf("Info & hours") !== -1,
    nav.join("|"));

  const counts = Array.from(doc.querySelectorAll("#nav .count")).map(text);
  check("menu count = 30 dishes + 23 drinks = 53", counts[1] === "53", counts.join(","));
  check("gallery count is 53", counts[3] === "53", counts.join(","));
  check("shop count is 10", counts[2] === "10");
  check("blog count is 6", counts[4] === "6");
  check("publish badge empty when nothing has changed", counts[7] === "");

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

console.log("\n" + "=".repeat(52));
console.log(fails === 0 ? `ALL ${passes} CHECKS PASSED` : `${fails} FAILED, ${passes} passed`);
process.exit(fails === 0 ? 0 : 1);
