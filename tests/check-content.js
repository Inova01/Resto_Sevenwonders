/* Verification harness for the Seven Wonders content layer.
   Runs the real content/*.js and js/content.js in a minimal fake
   browser, then asserts the things that would actually break the
   site: missing image files, dangling ids, serializer round-trips. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

/* Line endings must never decide whether a test passes. git checks these
   files out as CRLF on Windows (core.autocrlf) while the Serializer always
   emits LF, so any byte-for-byte comparison has to normalise first. */
const lfAll = (t) => t.replace(/\r\n/g, "\n");
let fails = 0, passes = 0;
function ok(name) { passes++; console.log("  ok   " + name); }
function bad(name, detail) { fails++; console.log("  FAIL " + name + (detail ? "\n         " + detail : "")); }
function check(name, cond, detail) { cond ? ok(name) : bad(name, detail); }

function walk(dir, out = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    if ([".git", "node_modules"].includes(entry.name)) return;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else out.push(abs);
  });
  return out;
}

/* ---- minimal browser stubs ---- */
const listeners = {};
const noopEl = new Proxy(function () {}, {
  get: (t, p) => (p === "classList" ? { add() {}, remove() {}, toggle() {}, contains: () => false }
    : p === "style" ? {}
    : p === "dataset" ? {}
    : typeof p === "string" ? noopEl : undefined),
  apply: () => noopEl,
  set: () => true
});
const sandbox = {
  console,
  window: null,
  document: {
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
    createElement: () => noopEl,
    querySelector: () => null,
    querySelectorAll: () => [],
    body: { appendChild() {}, classList: { add() {} } }
  },
  location: { search: "", hash: "" },
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  navigator: { userAgent: "node" },
  matchMedia: () => ({ matches: false }),
  TextEncoder, TextDecoder, Date, Math, JSON, isFinite, parseFloat, parseInt,
  setTimeout, clearTimeout, Object, Array, String, Number, Boolean, Error, RegExp, Promise
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

function run(rel) {
  const file = path.join(ROOT, rel);
  vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: rel });
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

console.log("\n=== 1. Content files load ===");
try {
  ["settings", "menu", "shop", "gallery", "blog", "home", "about"].forEach(s => run("content/" + s + ".js"));
  run("js/content.js");
  ok("content/*.js and js/content.js evaluate without throwing");
} catch (e) {
  bad("content layer failed to evaluate", e.stack);
  process.exit(1);
}

const SW = sandbox.window.SW;
check("window.SW was created", !!SW);
["settings", "menu", "shop", "gallery", "blog", "home", "about"].forEach(s =>
  check("SW." + s + " present", SW && SW[s] && typeof SW[s] === "object"));
check("SW.published snapshot present", SW.published && !!SW.published.menu);
check("preview is OFF with no query string", SW.isPreview === false);

console.log("\n=== 1b. Public repo safety ===");
{
  const textExt = new Set([".css", ".html", ".js", ".json", ".md", ".txt", ".xml", ".svg"]);
  const offenders = [];
  walk(ROOT).forEach(file => {
    if (!textExt.has(path.extname(file).toLowerCase())) return;
    const body = fs.readFileSync(file, "utf8");
    if (/sk_(live|test)_[A-Za-z0-9]/.test(body)) offenders.push(path.relative(ROOT, file));
  });
  check("no Stripe secret keys are committed", offenders.length === 0, offenders.join(", "));
}

console.log("\n=== 1d. Stripe payment architecture ===");
{
  const checkout = read("functions/api/checkout.js");
  const webhook = read("functions/api/stripe-webhook.js");
  const catalogText = lfAll(read("functions/_shared/shop-catalog.js"));
  const menuCatalogText = lfAll(read("functions/_shared/menu-catalog.js"));
  const match = /export const SHOP_CATALOG = ([\s\S]*?);\s*\n\nexport function/.exec(catalogText);
  const catalog = match ? JSON.parse(match[1]) : [];
  const menuMatch = /export const MENU_CATALOG = ([\s\S]*?);\s*\n\nexport const MENU_DAILY_SPECIAL/.exec(menuCatalogText);
  const menuCatalog = menuMatch ? JSON.parse(menuMatch[1]) : [];
  const menuIds = [];
  SW.eachMenuItem(item => menuIds.push(item.id));
  SW.menu.drinks.concat(SW.menu.desserts).forEach(item => menuIds.push(item.id));
  check("Stripe checkout function exists and uses server secrets",
    /STRIPE_SECRET_KEY/.test(checkout) &&
    /STRIPE_WEBHOOK_SECRET/.test(checkout) &&
    /api\.stripe\.com\/v1\/checkout\/sessions/.test(checkout));
  check("Stripe checkout re-prices from the server catalog",
    /SHOP_CATALOG/.test(checkout) &&
    /effectiveMenuPrice/.test(checkout) &&
    !/payload\.[a-zA-Z0-9_]*price/.test(checkout));
  check("Stripe checkout rejects tampered posted totals",
    /clientTotalCents/.test(checkout) && /The order total changed/.test(checkout));
  check("Stripe checkout rejects unknown or sold-out menu dishes",
    /findMenuProduct/.test(checkout) && /soldOut === true/.test(checkout));
  check("Stripe webhook verifies signed raw payloads",
    /STRIPE_WEBHOOK_SECRET/.test(webhook) &&
    /stripe-signature/i.test(webhook) &&
    /crypto\.subtle/.test(webhook));
  check("Stripe webhook surfaces kitchen order metadata",
    /customer_name/.test(webhook) && /order_summary/.test(webhook) && /pickup_time/.test(webhook));
  check("server Stripe catalog matches the public shop ids",
    JSON.stringify(catalog.map(p => p.id)) === JSON.stringify(SW.shop.products.map(p => p.id)),
    JSON.stringify(catalog.map(p => p.id)));
  check("server Stripe catalog keeps prices but not Payment Links",
    catalog.every(p => typeof p.price === "number" && p.paymentLink === undefined));
  check("server menu catalog matches the public menu order ids",
    JSON.stringify(menuCatalog.map(p => p.id)) === JSON.stringify(menuIds),
    JSON.stringify(menuCatalog.map(p => p.id)));
  check("server menu catalog can recompute the daily special discount",
    /MENU_SPECIAL_POOL_IDS/.test(menuCatalogText) && /effectiveMenuPrice/.test(menuCatalogText));
}

console.log("\n=== 1c. Image performance budget ===");
{
  run("js/image-meta.js");
  const META = sandbox.window.SW_IMAGE_META || {};
  const ASSET_BUDGET = 153600;
  const rasterExt = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  const assetsDir = path.join(ROOT, "assets");
  const rasterFiles = walk(assetsDir).filter(file => rasterExt.has(path.extname(file).toLowerCase()));
  const oversized = rasterFiles
    .map(file => ({ file, size: fs.statSync(file).size }))
    .filter(row => row.size > ASSET_BUDGET);
  check("no raster asset exceeds the 150 KiB budget",
    oversized.length === 0,
    oversized.map(row => path.relative(ROOT, row.file) + " " + row.size + "B").join(", "));

  const originals = rasterFiles
    .filter(file => !path.relative(assetsDir, file).startsWith("variants" + path.sep))
    .filter(file => /\.(jpe?g|png|webp)$/i.test(file))
    .map(file => path.relative(ROOT, file).replace(/\\/g, "/"));
  const missingMeta = originals.filter(src => !META[src]);
  check("image manifest covers every original raster asset",
    missingMeta.length === 0,
    missingMeta.join(", "));

  const badVariants = [];
  const declaredVariants = new Set();
  Object.keys(META).forEach(src => {
    (META[src].webp || []).forEach(v => {
      declaredVariants.add(v.src);
      const abs = path.join(ROOT, v.src.replace(/\//g, path.sep));
      if (!fs.existsSync(abs)) badVariants.push(v.src + " missing");
      else if (fs.statSync(abs).size > ASSET_BUDGET) badVariants.push(v.src + " over budget");
    });
  });
  check("all generated WebP variants exist and stay under budget",
    badVariants.length === 0,
    badVariants.join(", "));

  const staleVariants = rasterFiles
    .filter(file => path.relative(assetsDir, file).startsWith("variants" + path.sep))
    .map(file => path.relative(ROOT, file).replace(/\\/g, "/"))
    .filter(src => !declaredVariants.has(src));
  check("no stale WebP variants are left behind",
    staleVariants.length === 0,
    staleVariants.join(", "));

  const missingSmallVariants = originals.filter(src => !src.startsWith("assets/menu/")).filter(src => {
    const widths = ((META[src] || {}).webp || []).map(v => v.width);
    return Math.max.apply(null, widths.filter(w => w <= 360)) < Math.min(360, META[src].width);
  });
  check("images include small mobile/thumbnail WebP candidates",
    missingSmallVariants.length === 0,
    missingSmallVariants.join(", "));
}

console.log("\n=== 2. Helpers ===");
check("money() formats", SW.money(17.6) === "$17.60", SW.money(17.6));
check("money() survives null", SW.money(null) === "$0.00", SW.money(null));
check("formatDate()", SW.formatDate("2026-08-10") === "August 10, 2026", SW.formatDate("2026-08-10"));
check("formatDate() passes junk through", SW.formatDate("nope") === "nope");
check("telHref()", SW.telHref() === "tel:+19044029212", SW.telHref());
check("formsLive() false with no key", SW.formsLive() === false);

const grouped = SW.hoursGrouped();
check("hoursGrouped() collapses equal days", grouped.length === 4,
  JSON.stringify(grouped));
check("hoursGrouped() first range is Mon-Thu",
  grouped[0] && grouped[0].label === "Mon – Thu" && grouped[0].value === "9 AM – 8:30 PM",
  JSON.stringify(grouped[0]));
check("closedWeekdays() disables Sunday", JSON.stringify(SW.closedWeekdays()) === "[0]",
  JSON.stringify(SW.closedWeekdays()));

/* A closed day must map to the right JS weekday number (0=Sun) */
const saved = JSON.parse(JSON.stringify(SW.settings.hours));
SW.settings.hours[0].closed = true;            // Monday
check("closedWeekdays() maps Monday to 1", JSON.stringify(SW.closedWeekdays()) === "[1,0]",
  JSON.stringify(SW.closedWeekdays()));
SW.settings.hours[6].closed = false;           // Sunday open again
check("closedWeekdays() maps Sunday to 0", JSON.stringify(SW.closedWeekdays()) === "[1]",
  JSON.stringify(SW.closedWeekdays()));
SW.settings.hours = saved;

console.log("\n=== 3. Every referenced image exists on disk ===");
const seen = new Set();
function img(p, where) {
  if (!p) return;
  if (seen.has(p + where)) return;
  seen.add(p + where);
  const abs = path.join(ROOT, p.replace(/\//g, path.sep));
  if (!fs.existsSync(abs)) bad("missing file: " + p, "referenced by " + where);
}
SW.gallery.images.forEach((g, i) => img(g.src, "gallery.images[" + i + "]"));
SW.gallery.homepage.forEach((s, i) => img(s, "gallery.homepage[" + i + "]"));
SW.shop.products.forEach(p => img(p.img, "shop product " + p.id));
SW.blog.posts.forEach(p => img(p.img, "blog post " + p.id));
SW.menu.categories.forEach(c => {
  img(c.photo, "menu category " + c.id);
  c.subcats.forEach(s => s.items.forEach(i => img(i.img, "menu item " + i.id)));
});
[["hero", SW.home.hero.image], ["about", SW.home.about.image], ["ctaBanner", SW.home.ctaBanner.image]]
  .forEach(([k, v]) => img(v, "home." + k + ".image"));
(SW.home.events.items || []).forEach((e, i) => img(e.img, "home event " + i));
if (fails === 0) ok("all " + seen.size + " referenced image paths exist");

console.log("\n=== 4. Ids and cross-references resolve ===");
const ids = [];
SW.eachMenuItem(i => ids.push(i.id));
check("no duplicate dish ids", new Set(ids).size === ids.length,
  ids.filter((v, i) => ids.indexOf(v) !== i).join(", "));
SW.menu.featuredIds.forEach(id =>
  check("featured dish '" + id + "' exists on the menu", !!SW.findMenuItem(id)));
const galleryPaths = new Set(SW.gallery.images.map(g => g.src));
SW.gallery.homepage.forEach(s =>
  check("homepage photo '" + s.split("/").pop() + "' is in the gallery list", galleryPaths.has(s)));
check("homepage mosaic has 7 photos", SW.gallery.homepage.length === 7,
  "got " + SW.gallery.homepage.length);
const specialMode = SW.menu.dailySpecial.mode;
check("dailySpecial.mode is auto or manual", specialMode === "auto" || specialMode === "manual");
if (specialMode === "manual")
  check("pinned daily special exists", !!SW.findMenuItem(SW.menu.dailySpecial.itemId));
check("blog post ids are unique",
  new Set(SW.blog.posts.map(p => p.id)).size === SW.blog.posts.length);
check("blog dates are ISO yyyy-mm-dd",
  SW.blog.posts.every(p => /^\d{4}-\d{2}-\d{2}$/.test(p.date)));
check("shop product ids are unique",
  new Set(SW.shop.products.map(p => p.id)).size === SW.shop.products.length);
check("no shop product has a sale price above its normal price",
  SW.shop.products.every(p => p.sale == null || p.sale < p.price));
check("shop products have blank or valid Stripe Payment Links",
  SW.shop.products.every(p => typeof p.paymentLink === "string" &&
    (p.paymentLink === "" || /^https:\/\/buy\.stripe\.com\//i.test(p.paymentLink))),
  JSON.stringify(SW.shop.products.map(p => ({ id: p.id, paymentLink: p.paymentLink }))));
check("hours has exactly 7 days", SW.settings.hours.length === 7);

console.log("\n=== 5. Sold-out filtering (js/menu-data.js shim) ===");
SW.findMenuItem("griot-pork-platter").item.soldOut = true;
run("js/menu-data.js");
let shim = sandbox.window.SW_MENU;
let shimIds = [];
shim.categories.forEach(c => c.subcats.forEach(s => s.items.forEach(i => shimIds.push(i.id))));
check("a sold-out dish is removed from the rendered menu",
  shimIds.indexOf("griot-pork-platter") === -1);
check("other dishes are untouched", shimIds.indexOf("legume-platter") !== -1);
check("shim exposes info from settings",
  shim.info.phone === "904 402 9212" && /University Blvd/.test(shim.info.address),
  JSON.stringify(shim.info));

/* Empty a whole group and confirm it is dropped rather than rendered blank */
const lunch = SW.menu.categories.find(c => c.id === "lunch");
const sides = lunch.subcats.find(s => s.id === "ln-sides");
const keptItems = sides.items;
sides.items = [{ id: "x", name: "x", price: 1, soldOut: true }];
run("js/menu-data.js");
shim = sandbox.window.SW_MENU;
const lunchShim = shim.categories.find(c => c.id === "lunch");
check("a group where everything is sold out is dropped",
  !lunchShim.subcats.some(s => s.id === "ln-sides"));
sides.items = keptItems;
SW.findMenuItem("griot-pork-platter").item.soldOut = false;

console.log("\n=== 6. Serializer round-trip ===");
run("js/admin/store.js");
const Store = sandbox.window.SWStore;
["settings", "menu", "shop", "gallery", "blog", "home", "about"].forEach(section => {
  const text = Store.Serializer.render(section, SW.published[section]);
  const box = { window: { SW_CONTENT: {} } };
  box.window.window = box.window;
  vm.createContext(box);
  try {
    vm.runInContext(text, box, { filename: "generated/" + section + ".js" });
    const out = box.window.SW_CONTENT[section];
    check(section + ".js regenerates identically",
      JSON.stringify(out) === JSON.stringify(SW.published[section]));
  } catch (e) {
    bad(section + ".js failed to re-evaluate", e.message);
  }
});
check("Serializer path is content/<section>.js",
  Store.Serializer.path("menu") === "content/menu.js");
check("Serializer writes the server Stripe catalog beside shop.js",
  Store.Serializer.shopCatalogPath() === "functions/_shared/shop-catalog.js" &&
  /export const SHOP_CATALOG/.test(Store.Serializer.renderShopCatalog(SW.shop)) &&
  Store.Serializer.menuCatalogPath() === "functions/_shared/menu-catalog.js" &&
  /export const MENU_CATALOG/.test(Store.Serializer.renderMenuCatalog(SW.menu)));
check("checked-in server Stripe catalog matches dashboard serialization",
  lfAll(Store.Serializer.renderShopCatalog(SW.shop)) === lfAll(read("functions/_shared/shop-catalog.js")) &&
  lfAll(Store.Serializer.renderMenuCatalog(SW.menu)) === lfAll(read("functions/_shared/menu-catalog.js")));

console.log("\n=== 7. Change detection ===");
const base = Store.clone(SW.published);
check("identical draft reports no changes",
  Store.Draft.changedSections(base, SW.published).length === 0);
base.menu.categories[0].label = "Brunch";
const ch = Store.Draft.changedSections(base, SW.published);
check("editing the menu reports exactly one changed section",
  ch.length === 1 && ch[0] === "menu", JSON.stringify(ch));
const files = Store.Serializer.filesFor(base, SW.published);
check("menu edits queue public content and the server menu catalog",
  files.length === 2 &&
  files[0].path === "content/menu.js" &&
  files[1].path === "functions/_shared/menu-catalog.js",
  JSON.stringify(files.map(f => f.path)));
const shopDraft = Store.clone(SW.published);
shopDraft.shop.products[0].price = 15;
const shopFiles = Store.Serializer.filesFor(shopDraft, SW.published);
check("editing shop publishes both public content and server catalog",
  JSON.stringify(shopFiles.map(f => f.path)) === JSON.stringify(["content/shop.js", "functions/_shared/shop-catalog.js"]),
  JSON.stringify(shopFiles.map(f => f.path)));
check("UTF-8 survives serialization (Patte Kòde / Pate Fête)",
  /K.{0,2}de/.test(files[0].text) === false || files[0].text.includes("Kòde"),
  "accented characters look mangled");

console.log("\n=== 8. Draft preview only applies in preview mode ===");
{
  const s2 = Object.assign({}, sandbox);
  const draftStore = { sw_admin_draft_v1: JSON.stringify({ settings: { tagline: "DRAFT TAGLINE" } }) };
  const mk = (search) => {
    const bx = {
      console, document: sandbox.document, Date, Math, JSON, isFinite,
      parseFloat, parseInt, Object, Array, String, Number, Boolean, Error, RegExp,
      location: { search },
      sessionStorage: (() => { let v = {}; return { getItem: k => v[k] ?? null, setItem: (k, x) => v[k] = x, removeItem: k => delete v[k] }; })(),
      localStorage: { getItem: k => draftStore[k] ?? null, setItem() {}, removeItem() {} },
      matchMedia: () => ({ matches: false })
    };
    bx.window = bx; bx.globalThis = bx;
    vm.createContext(bx);
    ["settings", "menu", "shop", "gallery", "blog", "home", "about"].forEach(s =>
      vm.runInContext(fs.readFileSync(path.join(ROOT, "content", s + ".js"), "utf8"), bx));
    vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "content.js"), "utf8"), bx);
    return bx.window.SW;
  };
  const normal = mk("");
  const preview = mk("?preview=1");
  check("a visitor does NOT see the draft", normal.settings.tagline !== "DRAFT TAGLINE",
    normal.settings.tagline);
  check("?preview=1 DOES see the draft", preview.settings.tagline === "DRAFT TAGLINE",
    preview.settings.tagline);
  check("preview flag is reported", preview.isPreview === true && normal.isPreview === false);
}

console.log("\n" + "=".repeat(52));
console.log(fails === 0 ? `ALL ${passes} CHECKS PASSED` : `${fails} FAILED, ${passes} passed`);
process.exit(fails === 0 ? 0 : 1);
