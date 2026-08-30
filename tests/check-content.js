/* Verification harness for the Seven Wonders content layer.
   Runs the real content/*.js and js/content.js in a minimal fake
   browser, then asserts the things that would actually break the
   site: missing image files, dangling ids, serializer round-trips. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
let fails = 0, passes = 0;
function ok(name) { passes++; console.log("  ok   " + name); }
function bad(name, detail) { fails++; console.log("  FAIL " + name + (detail ? "\n         " + detail : "")); }
function check(name, cond, detail) { cond ? ok(name) : bad(name, detail); }

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

console.log("\n=== 1. Content files load ===");
try {
  ["settings", "menu", "shop", "gallery", "blog", "home"].forEach(s => run("content/" + s + ".js"));
  run("js/content.js");
  ok("content/*.js and js/content.js evaluate without throwing");
} catch (e) {
  bad("content layer failed to evaluate", e.stack);
  process.exit(1);
}

const SW = sandbox.window.SW;
check("window.SW was created", !!SW);
["settings", "menu", "shop", "gallery", "blog", "home"].forEach(s =>
  check("SW." + s + " present", SW && SW[s] && typeof SW[s] === "object"));
check("SW.published snapshot present", SW.published && !!SW.published.menu);
check("preview is OFF with no query string", SW.isPreview === false);

console.log("\n=== 2. Helpers ===");
check("money() formats", SW.money(17.6) === "$17.60", SW.money(17.6));
check("money() survives null", SW.money(null) === "$0.00", SW.money(null));
check("formatDate()", SW.formatDate("2026-08-10") === "August 10, 2026", SW.formatDate("2026-08-10"));
check("formatDate() passes junk through", SW.formatDate("nope") === "nope");
check("telHref()", SW.telHref() === "tel:+19044029212", SW.telHref());
check("formsLive() false with no key", SW.formsLive() === false);

const grouped = SW.hoursGrouped();
check("hoursGrouped() collapses equal days", grouped.length === 3,
  JSON.stringify(grouped));
check("hoursGrouped() first range is Mon-Thu",
  grouped[0] && grouped[0].label === "Mon – Thu" && grouped[0].value === "8 AM – 9 PM",
  JSON.stringify(grouped[0]));
check("closedWeekdays() empty (nothing marked closed)", SW.closedWeekdays().length === 0);

/* A closed day must map to the right JS weekday number (0=Sun) */
const saved = JSON.parse(JSON.stringify(SW.settings.hours));
SW.settings.hours[0].closed = true;            // Monday
check("closedWeekdays() maps Monday to 1", JSON.stringify(SW.closedWeekdays()) === "[1]",
  JSON.stringify(SW.closedWeekdays()));
SW.settings.hours[6].closed = true;            // Sunday
check("closedWeekdays() maps Sunday to 0", JSON.stringify(SW.closedWeekdays()) === "[1,0]",
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
check("hours has exactly 7 days", SW.settings.hours.length === 7);

console.log("\n=== 5. Sold-out filtering (js/menu-data.js shim) ===");
SW.findMenuItem("griot-pork-platter").item.soldOut = true;
run("js/menu-data.js");
let shim = sandbox.window.SW_MENU;
let shimIds = [];
shim.categories.forEach(c => c.subcats.forEach(s => s.items.forEach(i => shimIds.push(i.id))));
check("a sold-out dish is removed from the rendered menu",
  shimIds.indexOf("griot-pork-platter") === -1);
check("other dishes are untouched", shimIds.indexOf("tasso-beef") !== -1);
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
["settings", "menu", "shop", "gallery", "blog", "home"].forEach(section => {
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

console.log("\n=== 7. Change detection ===");
const base = Store.clone(SW.published);
check("identical draft reports no changes",
  Store.Draft.changedSections(base, SW.published).length === 0);
base.menu.categories[0].label = "Brunch";
const ch = Store.Draft.changedSections(base, SW.published);
check("editing the menu reports exactly one changed section",
  ch.length === 1 && ch[0] === "menu", JSON.stringify(ch));
const files = Store.Serializer.filesFor(base, SW.published);
check("only the changed file is queued for publishing",
  files.length === 1 && files[0].path === "content/menu.js",
  JSON.stringify(files.map(f => f.path)));
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
    ["settings", "menu", "shop", "gallery", "blog", "home"].forEach(s =>
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
