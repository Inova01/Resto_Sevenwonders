# Seven Wonders Bakery & Grill — Jacksonville FL

A Haitian kitchen and bakery at 2145 University Blvd N. Pure HTML / CSS /
vanilla JavaScript — no frameworks, no build step, no server.

**The manager edits the site themselves at [`admin.html`](admin.html).**
See **[ADMIN.md](ADMIN.md)** — written for them, not for a developer.

## Pages
- `index.html` — Home: hero, our story, menu of the day, featured dishes, events, gallery, guest reviews, blog preview
- `menu.html` — Gallery / Menu / Reservation in one page, plus the online order builder
- `shop.html` — Product grid with a localStorage cart
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
content/gallery.js    all 53 photos + the 7 on the homepage
content/blog.js       posts
content/home.js       homepage copy, events, guest reviews
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
- **Apricot** `#ED9E58` (light `#F7C08A`, deep `#D97E33`) on pure black `#000` / near-black `#0A0A0A`
- Typography: Playfair Display + DM Sans (Google Fonts)
- Ember/fire canvas animation on the hero; respects `prefers-reduced-motion`

## Run locally
```bash
cd seven-wonders
python -m http.server 8000
# site      http://localhost:8000
# dashboard http://localhost:8000/admin.html
```

## Configuration

One setting is required for the site to function properly:

**Web3Forms key** — until it is set, the reservation form, contact form and
online ordering **cannot send anything**. They tell guests so and give them the
phone number, rather than showing a fake confirmation. Get a free key at
[web3forms.com](https://web3forms.com) and paste it into the dashboard under
*Info & hours → Online forms*.

Publishing from the dashboard needs a fine-grained GitHub token with
`Contents: Read and write` on this repository — see [ADMIN.md](ADMIN.md).
Without one, the dashboard still works and can hand you the files to upload.

## Tests
```bash
node tests/check-content.js    # 58 checks, no dependencies
npm i jsdom && node tests/check-pages.js   # 115 checks, renders every page
```
See [tests/README.md](tests/README.md). Run the first one after hand-editing
anything in `content/`.

## Deployment
Pushing to `main` triggers `.github/workflows/deploy.yml`, which publishes to
GitHub Pages. The dashboard's Publish button makes exactly that push — one
commit containing every changed content file, so one deploy.
