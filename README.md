# Seven Wonders Restaurant & Bakery — Jacksonville FL

A Haitian kitchen and bakery at 2145 University Blvd N. Pure HTML / CSS /
vanilla JavaScript for the public site, plus Cloudflare Pages Functions for
Stripe checkout. No frontend framework and no build step are required.

**The manager edits the site themselves at [`admin.html`](admin.html).**
See **[ADMIN.md](ADMIN.md)** — written for them, not for a developer.

## Pages
- `index.html` — Home: hero, our story, menu of the day, featured dishes, events, gallery, guest reviews, blog preview
- `about.html` — The founding story, the founders, photos of the restaurant
- `menu.html` — Gallery / Menu / Reservation in one page, plus the online order builder
- `shop.html` — Product grid with a combined cart and Stripe checkout
- `reservation.html` — Booking form + availability calendar
- `blog.html` — Posts with in-page detail views
- `contact.html` — Info, map, contact form
- `admin.html` — Manager dashboard (not linked from the site; `noindex`)

## Architecture

Everything a manager can change lives in `content/`. Nothing editable is
written into the HTML any more, so there is exactly one place to change a
price, an address or an opening time.

```
content/settings.js   identity, address, phone, hours, socials, form key
content/menu.js       categories → dishes → prices, drinks, daily special
content/shop.js       shop products
functions/api/*       Stripe checkout + signed webhook endpoints
functions/_shared/*   server-side product catalog for Stripe prices
content/gallery.js    all 53 photos + the 7 on the homepage
content/blog.js       posts
content/home.js       homepage copy, events, guest reviews
content/about.js      the About page: story, founders, venue photos
        ↓
js/content.js         → window.SW  (+ draft preview, shared helpers)
        ↓
js/site-render.js     paints footers, contact, shop, blog, homepage
js/menu-data.js       → window.SW_MENU, sold-out items filtered out
js/menu-render.js     menu tabs + order builder
js/gallery.js         mosaic gallery + lightbox
js/reservation.js     shared booking widget
js/main.js            behaviour — loads last, after site-render.js

admin.html
js/admin/store.js     draft · serializer · publishers (GitHub/download/Supabase)
js/admin/app.js       dashboard UI
```

Script order matters: `content/*.js` → `js/content.js` → page scripts →
`js/site-render.js` → `js/main.js`.

## Design system

**Light where you read, dark where you look.** The site is light by default
and goes dark only where a dark ground earns something: the hero, the photo
gallery band, the footer and the lightboxes.

```
--ground      #FBF7F1   warm cream, the default page ground
--ground-2    #F3EADD   deeper cream for alternating bands
--surface     #FFFFFF   cards, lifted with --shadow-card
--ink-strong  #140E09   headings
--ink         #2A1E15   body text
--ink-muted   #6B5B4E   secondary text
--accent      #9A5112   apricot, darkened enough to carry text on light
```

Every rule uses these semantic tokens rather than literal colours. The tokens
are redefined inside one selector list (`.on-dark, .hero, .site-footer,
.section--dark, …`), so a component needs no knowledge of which ground it is
sitting on. There are three grounds in total: light, dark, and the gold band.

**Why `--accent` is not `--apricot`:** apricot `#ED9E58` measures **2.18:1**
on a light ground, so it cannot legally carry text there. `--accent` is
apricot darkened until it clears 4.5:1 against `--ground-2`, the tightest
case on the site (it lands at 4.95:1). Apricot itself is still used at full
strength wherever it is a *fill* behind dark text — which is where gold
actually reads as gold rather than as beige.

- **Apricot** `#ED9E58` (light `#F7C08A`, deep `#D97E33`); `--gold-ink`
  `#1A1208` for text on gold
- Exactly **one** apricot-filled section: the closing reservation banner
- Typography: Playfair Display + DM Sans (Google Fonts)
- Ember/fire canvas animation on the dark hero; respects `prefers-reduced-motion`
- Every text/ground pair on the site is AA or better; the tightest is 4.77:1

The dashboard (`css/admin.css`) keeps its own dark token block on purpose —
it is a back-office tool, not part of the guest-facing site.

## Run locally
```bash
cd seven-wonders
python -m http.server 8000
# site      http://localhost:8000
# dashboard http://localhost:8000/admin.html
```

## Configuration

Two settings are required for the site to function properly:

**Web3Forms key** — until it is set, the reservation form, contact form and
reservation requests **cannot send anything**. They tell guests so and give them the
phone number, rather than showing a fake confirmation. Get a free key at
[web3forms.com](https://web3forms.com) and paste it into the dashboard under
*Info & hours → Online forms*.

**Stripe secrets** — the Shop page can collect combined-cart payments when the
site is deployed on Cloudflare Pages. Add `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET` as encrypted Cloudflare Variables and Secrets. Do not
commit Stripe secret keys. `.dev.vars.example` lists the supported variable
names for local testing.

Publishing from the dashboard needs a fine-grained GitHub token with
`Contents: Read and write` on this repository — see [ADMIN.md](ADMIN.md).
Without one, the dashboard still works and can hand you the files to upload.

## Tests
```bash
node tests/check-content.js    # 60 checks, no dependencies
npm i jsdom && node tests/check-pages.js   # 133 checks, renders every page
```
See [tests/README.md](tests/README.md). Run the first one after hand-editing
anything in `content/`.

## Deployment
Pushing to `main` triggers `.github/workflows/deploy.yml`, which publishes to
GitHub Pages. The dashboard's Publish button makes exactly that push — one
commit containing every changed content file, so one deploy.

GitHub Pages serves only the static site. The Stripe functions in `functions/`
run when this same repo is deployed on Cloudflare Pages.
