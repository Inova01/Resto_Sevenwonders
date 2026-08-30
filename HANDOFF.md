# Handoff — Seven Wonders Restaurant & Bakery

Written 2026-08-30. Everything described here is committed and live.
Repo: `github.com/Inova01/Resto_Sevenwonders` · GitHub Pages deploys from `main`.

---

## 1. What this project is

A static marketing + ordering site for a Haitian restaurant and bakery at
2145 University Blvd N, Jacksonville FL. Pure HTML / CSS / vanilla JS —
**no framework, no build step, no server.** Deployed by GitHub Actions to
GitHub Pages on every push to `main`.

The distinguishing feature: **the restaurant manager edits the site
themselves** through `admin.html`, with no developer involved.

---

## 2. Architecture

```
content/*.js        the editable data. Plain JS assigning into
                    window.SW_CONTENT — deliberately NOT fetch()/JSON,
                    so the site works over file:// as well as http://
      |
js/content.js       merges them into window.SW, applies DEFAULTS so a
                    missing or malformed content file cannot white-screen
                    the site, layers the localStorage draft ONLY in
                    preview mode, exposes shared helpers (money, dates,
                    opening hours)
      |
js/site-render.js   paints footers, contact, shop, blog, homepage, About
js/menu-data.js     shim -> window.SW_MENU, sold-out items filtered out
js/menu-render.js   menu tabs + online order builder
js/gallery.js       mosaic gallery + lightbox
js/reservation.js   shared booking widget
js/main.js          behaviour — MUST load after site-render.js

admin.html
js/admin/store.js   Draft (localStorage) · Serializer (data -> file text)
                    · Publishers (GitHub / Download / Supabase)
js/admin/app.js     the dashboard UI
```

**Script order matters on every page:**
`content/*.js` -> `js/content.js` -> page scripts -> `js/site-render.js` -> `js/main.js`

**Content sections** (the publishable set, defined identically in
`js/content.js` and `js/admin/store.js` — keep them in sync):
`settings, menu, shop, gallery, blog, home, about`

### Publishing
The dashboard commits via the GitHub **git data API** (blobs -> tree ->
commit -> move ref) so all changed files land in **one commit** = one Pages
deploy. The simpler contents API would make one commit per file and set off
a race of deploys. The ref is moved with `force: false`, so a concurrent
push is rejected rather than silently overwritten. A Download-files
publisher is the always-works fallback and needs no token.

### Colour system (important for the theme-toggle task)
The site is **light by default and dark only where a dark ground earns it**.
Every CSS rule uses semantic tokens, never literal colours:

```
--ground #FBF7F1   --ground-2 #F3EADD   --surface #FFFFFF
--ink-strong #140E09   --ink #2A1E15   --ink-muted #6B5B4E
--line   --fill-subtle   --dot-idle   --accent   --shadow-card
```

Those are defined for the light ground in `:root`, then **redefined inside
one selector list** for regions that stay dark:

```css
.on-dark, .site-header, .hero, .page-hero, .section--dark,
.site-footer, .lightbox, .mgal-lb, .subnav-bar, .event-card { ... }
```

`.cta-banner` is a third ground (gold) with its own token set.

**`--accent` is separate from `--apricot` on purpose.** Apricot `#ED9E58`
measures **2.18:1** against a light ground and legally cannot carry text
there. `--accent` is apricot darkened to `#9A5112`, chosen to clear 4.5:1
against `--ground-2` (the tightest pairing on the site — it lands at
4.95:1). Inside a dark region `--accent` reverts to true apricot. Apricot
at full strength is still used wherever it is a **fill** behind dark text
(buttons, calendar head, the gold band) — that is where gold reads as gold
rather than as beige.

`css/admin.css` has its own separate dark token block. The dashboard is a
back-office tool and is intentionally not part of the guest-facing theme.

---

## 3. How to work on this repo

These are conventions the existing code already follows. Please keep them.

1. **Verify, don't assert.** Measure things. Contrast ratios get computed,
   not eyeballed. Remote state gets fetched, not assumed.
2. **Distrust a check that cannot fail.** Three checks written during this
   session passed trivially (comparing a repo against itself, grepping the
   wrong directory) and had to be redone. If a test would pass even when
   broken, it is not a test.
3. **One source of truth.** A price exists in `content/menu.js` and nowhere
   else. Do not reintroduce a second place to change an address, a price or
   an opening time.
4. **Tests are the contract.** `node tests/check-content.js` (60 checks, no
   dependencies) and `npm i jsdom && node tests/check-pages.js` (133 checks,
   renders every page in jsdom). Run both before and after any change. When
   reality legitimately changes, update the assertion — do not delete it.
5. **`textContent`, never `innerHTML`,** for anything a manager typed. Blog
   and About bodies are arrays of plain strings for the same reason. This is
   the only thing preventing dashboard input from injecting markup.
6. **Honest failure over fake success.** With no Web3Forms key the forms
   tell guests "not connected, please call 904 402 9212" instead of showing
   a thank-you that goes nowhere. Preserve that behaviour.
7. **Degrade safely.** `js/content.js` DEFAULTS exist so a broken content
   file cannot take the site down. Empty lists hide their section rather
   than rendering an empty shell.
8. **Bump the stylesheet cache-buster on every CSS change**
   (`css/style.css?v=...` in all 8 HTML files). Without it returning
   visitors keep the old CSS through a hard refresh.
9. **Commit messages explain _why_,** including what was considered and
   rejected. `git log` is the design record for this project.
10. **Never commit a secret.** The repo is public. See the Stripe section.

---

## 4. What was done on 2026-08-30

Five commits, all pushed, repo in sync at 0 behind / 0 ahead.

| Commit | What |
|---|---|
| `8e26f8a` | Content-driven site + manager dashboard (~5,000 lines that had been sitting uncommitted for 10 days) |
| `b7b83d4` | **Merge** of `origin/main` — resolved a collision where 8 remote commits and the dashboard refactor had rewritten the same six files |
| `8721e2c` | Warmed the darks so section bands became visible; added one gold band |
| `903dbfd` | Light cream ground by default, dark only where it earns it |

Highlights:

- **Merge reconciliation.** Kept from the remote: `about.html`, the five
  `assets/restaurant/` photos, the printed "Current Menu Board" section, the
  higher-res menu scans, the real name "Seven Wonders Restaurant & Bakery",
  and the **updated printed menu** (28 dishes at current prices). Dropped an
  encoding regression that had flattened every em dash, star and accented
  letter into ASCII, plus a revert of the daily special.
- Because prices live in one place now, `content/shop.js` had to be
  repriced (it still carried old-menu prices and would have contradicted the
  menu) and `featuredIds` had to be fixed (it pointed at Tasso Beef, which
  is no longer served).
- **About page brought under the CMS**: `content/about.js`, an "About page"
  dashboard screen, `renderAbout()`. Its address and phone read from
  `settings`, so they cannot drift from the footer.
- **Deleted a duplicate clone** at `C:\Users\Asus\Resto_Sevenwonders` (24 MB,
  no dashboard, strict subset). Its one unique commit is preserved as the
  local tag `archive/resto-clone-daily-special` — **local only, never
  pushed.** It also carried a local git config override (`inova01` /
  gmail) which was the cause of the split author identity.
- Fixed three raw NUL bytes in `js/admin/app.js` (a "null option" sentinel
  written as literal bytes) that made git and grep treat the file as binary.
- Tests grew 58 -> 60 and 115 -> 133.

---

## 5. Task A — day / night theme toggle

**The architecture is already 90% there, which is why this is a small job.**
Both palettes exist and are shipped: the light one is current, and the dark
one is exactly what the site looked like at commit `8721e2c`.

### Recommended approach

Turn the ground tokens into theme-scoped blocks:

```css
:root, [data-theme="light"] { /* the current light values */ }
[data-theme="dark"] {
  --ground: #000000;      /* full black, as requested */
  --ground-2: #1A1613;    /* warm charcoal — see the warning below */
  --surface: #241D18;
  --ink-strong: #FFFFFF; --ink: #E8E8E8; --ink-muted: #9A9A9A;
  --line: rgba(237,158,88,0.28);
  --accent: var(--apricot);        /* apricot works as text on dark */
  --accent-soft: var(--apricot-light);
  --shadow-card: 0 10px 30px rgba(0,0,0,.45);
}
```

The existing `.on-dark` region list can stay exactly as it is — those
regions are already dark in both themes.

**Critical warning, learned the hard way today:** do **not** make
`--ground-2` equal to `--ground` in dark mode. The site originally used
`#000000` and `#0A0A0A`, which sit **1.06:1** apart — perceptually
identical. The alternating sections existed in the markup but the eye saw
one unbroken black slab, and that is exactly the complaint that started
this work. Keep `--ground-2` at `#1A1613` (1.17:1 against black, which
*is* visible).

### Requirements

1. **No flash of the wrong theme.** A tiny inline script in `<head>`,
   before the stylesheet, must set `data-theme` on `<html>`. Anything that
   runs after CSS paints will flash.
2. **Default to `prefers-color-scheme`**, then let an explicit user choice
   override it and persist in `localStorage`.
3. **Do not auto-switch on the site's own clock.** The user asked about a
   day/night behaviour; `prefers-color-scheme` already tracks most people's
   day/night through their OS, and it is *their* preference rather than a
   guess. A site that changes appearance on its own clock reads as broken,
   and it will fight a visitor who deliberately chose light mode at 9pm.
   If a time-based default is still wanted, use it only as the *initial*
   value when there is no OS preference and no stored choice.
4. **Toggle button** in `.nav-actions` beside the cart, with
   `aria-pressed`, a real accessible label, and a sun/moon icon following
   the existing inline-SVG style. Must be keyboard reachable.
5. **Re-verify contrast in both themes.** Every text/ground pair must be
   AA. Do not skip this — `--accent` `#9A5112` is *only* correct on light;
   on black it is far too dark and must revert to apricot.
6. **Consider exposing the default theme in `content/settings.js`** so the
   manager can pick the site's starting appearance from the dashboard. That
   fits this project's philosophy. If you add it: add the field, add a
   DEFAULT in `js/content.js`, render it, add an editor in the matching
   `view*()` in `js/admin/app.js`, and extend the tests.
7. Add tests to `tests/check-pages.js` for both themes.

---

## 6. Task B — Stripe payments

### READ THIS FIRST. It changes the whole approach.

**This site is static and has no server.** Stripe's secret key
(`sk_live_...` / `sk_test_...`) can **never** appear in client-side JS, in
`content/*.js`, or anywhere in this repo — the repo is public, and a
committed live secret key is a real incident requiring immediate key
rotation. Only the **publishable** key (`pk_...`) is safe in the browser.

Stripe's old client-only Checkout is deprecated. Do not use it.

That leaves two viable routes:

**Route 1 — Stripe Payment Links (no backend at all).**
Create a Payment Link per product in the Stripe dashboard, store the URL on
the product in `content/shop.js`, and have the button navigate to it. Adds
a `paymentLink` field the manager can paste into the dashboard.
- Pros: works today on GitHub Pages, no server, no secret key anywhere, no
  hosting change, and the manager can manage it themselves.
- Cons: no combined cart total across items, less control over the flow.
- **This is the right first step** and fits the project's constraints.

**Route 2 — Stripe Checkout Sessions (needs a server endpoint).**
A serverless function creates the Checkout Session with the secret key held
as an environment variable, and the browser redirects to the returned URL.
- GitHub Pages **cannot** run this. It requires Cloudflare Pages Functions
  / Workers, Netlify Functions, or Vercel.
- Note: commit `7795219` already made every link domain-relative
  specifically to prepare for "the future Cloudflare domain", so
  **Cloudflare Pages + a Worker is the natural fit.**
- Handles the existing multi-item localStorage cart properly.
- Also needs a webhook endpoint to confirm payment, and prices must be
  validated **server-side** against `content/menu.js` — never trust a total
  posted from the browser.

### Existing integration points
- `shop.html` already has a localStorage cart (`[data-add-to-cart]`).
- `js/menu-render.js` has the online order builder with live totals.
- Both currently submit by email through Web3Forms.

### Do first, before any payment work
**The Web3Forms key is still not set.** Reservations, contact messages and
online orders currently reach nobody. Taking payments while order
notifications go nowhere would be worse than not taking payments. Get a
free key at web3forms.com and paste it into the dashboard under
*Info & hours -> Online forms*.

---

## 7. Outstanding items

| Item | Notes |
|---|---|
| **Web3Forms key** | Not set. Nothing from any form reaches the restaurant. Highest value, ~2 minutes. |
| **Dashboard publish token** | Not set. Dashboard works but hands you files to upload instead of publishing. Fine-grained token, Contents: Read and write. |
| **Dashboard PIN** | Must be set in the manager's own browser (SHA-256 hash in `localStorage`, key `sw_admin_meta_v1`). It is deliberately not in any file — it cannot be, and should not be, committed to a public repo. It is a curtain, not a lock. |
| **`admin.html` is publicly reachable** | Inherent to a static site. `noindex` + `Disallow` in robots.txt, and it can publish nothing without a token. For a real lock, put Cloudflare Access in front of `/admin.html`. |
| **Opening hours unconfirmed** | The times in `content/settings.js` were a plausible guess. `verified.hours` is `false`. |
| **`archive/resto-clone-daily-special`** | Local tag only, never pushed. Holds the deleted duplicate clone's one unique commit. |

---

## 8. Local development

```bash
cd seven-wonders
python -m http.server 8000
# site      http://localhost:8000
# dashboard http://localhost:8000/admin.html

node tests/check-content.js              # 60 checks, no dependencies
npm i jsdom && node tests/check-pages.js # 133 checks, renders every page
```

`package.json`, `package-lock.json` and `node_modules/` are gitignored on
purpose: jsdom is a test-only, ad-hoc install and the shipped site stays
dependency-free.
