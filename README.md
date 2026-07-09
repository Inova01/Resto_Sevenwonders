# Seven Wonders — Fine Dining, Jacksonville FL

An upscale restaurant website. Pure HTML / CSS / vanilla JavaScript — no frameworks, no build step.

## Pages
- `index.html` — Home: hero + ember animation, menu of the day, featured dishes, live music, gallery, testimonial slider, reservation CTA, blog preview
- `menu.html` — Tabbed menu (Starter · Mains · Desserts · Drinks)
- `shop.html` — Product grid with localStorage cart
- `reservation.html` — Booking form (Web3Forms) + live availability calendar
- `blog.html` — Posts with in-page detail views
- `contact.html` — Info, Google Map, contact form

## Design system
- **Apricot** `#ED9E58` (light `#F7C08A`, deep `#D97E33`) accents on pure black `#000` / near-black `#0A0A0A`
- Typography: Playfair Display + DM Sans (Google Fonts)
- Signature ember/fire canvas animation on the hero; respects `prefers-reduced-motion`

## Run locally
```bash
cd seven-wonders
python -m http.server 8000
# then open http://localhost:8000
```

## Configuration
- Replace `PLACEHOLDER_WEB3FORMS_KEY` in `reservation.html` and `contact.html` with your [Web3Forms](https://web3forms.com) access key to receive form submissions by email.
- Placeholder imagery is loaded from Unsplash; swap for your own photos when ready.

## Structure
```
seven-wonders/
├── index.html  menu.html  shop.html
├── reservation.html  blog.html  contact.html
├── css/style.css
├── js/main.js
└── assets/favicon.svg
```
