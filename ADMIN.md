# Managing the Seven Wonders website

You do not need a technician to change the website. Open **`admin.html`** on
the site (for example `https://…/admin.html`) and everything below is yours to
edit.

Nothing you type goes live until you press **Publish**. Until then it is a
draft, saved in your own browser, and you can look at it with **Preview** as
often as you like.

---

## Contents

1. [The three buttons that matter](#the-three-buttons-that-matter)
2. [Everyday jobs](#everyday-jobs)
3. [First-time setup](#first-time-setup)
4. [Who can open the dashboard](#who-can-open-the-dashboard)
5. [When something looks wrong](#when-something-looks-wrong)
6. [For a developer](#for-a-developer)

---

## The three buttons that matter

| Button | What it does |
|---|---|
| **Preview site** | Opens the real website in a new tab, showing your unpublished changes. Only you see this — it is your browser, not the live site. |
| **Publish** | Makes your changes public. Takes about a minute to appear. |
| **Discard all my changes** | Throws away everything unpublished and goes back to what the website shows now. |

The bar at the top of every screen tells you where you stand: *"Everything is
published"* or *"2 sections changed — not published yet"*.

Your draft lives in **the browser you typed it in**. It is not on your phone,
and clearing your browsing data will delete it. So publish when you are done.

---

## Everyday jobs

### Change a price
**Menu & prices** → find the dish → type the new price → **Publish**.

The homepage updates too. Prices are stored in one place only, so the menu, the
online order form, the Shop page and the "Featured Dishes" row can never
disagree with each other again.

Leave a price **blank** for dishes where it varies (Spaghetti, Fritay). A box
appears to type what guests see instead — "Variable".

### Mark something sold out
**Menu & prices** → tick **Sold out**.

That dish immediately disappears from the menu, from the online order form,
from the daily special and from the homepage. Untick it when it is back. If
every dish in a group is sold out, the whole group is hidden rather than shown
empty.

For Shop items the equivalent is untickng **In stock** — the card stays but
shows "Sold out" and cannot be added to a cart.

### Set today's special
**Menu & prices** → *Menu of the Day*.

- **Automatic** — the site picks one main dish per day by itself. Every visitor
  sees the same dish, and it changes at midnight. Leave it here and forget it.
- **Always show one dish I pick** — for a real special. Choose the dish.

**Discount %** is taken off the normal price and rounded to the nearest 50¢.
Set it to `0` to show the plain price with no strike-through.

### Add a photo
Photos are files, and a web page cannot copy a file into the website. So:

1. Get the image file into the site's `assets/gallery/` folder, next to
   `gallery-01.jpeg` and the rest. (Ask whoever manages the files, or upload it
   on GitHub: **Add file → Upload files** inside that folder.)
2. **Gallery** → *Add a photo* → type the filename → **Add photo**.

The dashboard checks the file really loads before adding it, so a typo is
caught there instead of showing guests a broken image.

Then write a **description** for it. That is what someone using a screen reader
hears instead of the photo, and it helps the site turn up in image searches. A
short phrase is plenty: *"Griot with rice and beans"*.

### Choose the homepage photos
**Gallery** → click the **☆** on a photo to star it.

The homepage mosaic is designed for exactly **seven** photos. The first and
sixth are drawn wide and the second tall — that is what stops it looking like a
plain grid. The *Homepage order* box at the bottom lets you reorder them.

### Change the About page
**About page** → your story, the founders, the photos of the restaurant.

The story boxes take one paragraph per blank line. The two founder cards can
be renamed, reordered or removed — delete both and the block disappears rather
than leaving an empty column.

The address and phone at the bottom of that page are **not** typed there. They
come from **Info & hours**, the same as every footer, so you change them once.

### Write a blog post
**Blog** → **+ Write a new post**.

New posts start **unpublished** — saved, but invisible to guests. Write it,
tick **Published**, then Publish. Leave a blank line between paragraphs.

Posts show newest first, on the blog page and on the homepage. You choose how
many appear on the homepage at the top of the Blog screen.

### Change opening hours
**Info & hours** → *Opening hours*.

Tick **Closed** for a day and it is greyed out on the booking calendar, so
guests cannot request a table then. Days in a row with the same hours are
joined together in the footer automatically: *Mon – Thu · 8 AM – 9 PM*.

### Add an event or live music
**Homepage** → *Events & live music* → **+ Add event**.

Every event has a real date. Once it passes it hides itself, and when nothing
is coming up the whole section disappears — so the homepage can never advertise
a night that has already been.

### Add a guest review
**Homepage** → *Guest reviews*.

Only publish words a guest actually said. Leave the photo blank and the card
shows their initials instead of a stock photo of a stranger. With no reviews,
the section is hidden.

---

## First-time setup

Two things need doing once. The dashboard's Overview screen nags you about both
until they are done.

### 1. Switch the forms on — do this first

**Right now, nothing from the website reaches you.** The reservation form, the
contact form and online ordering have no email key, so they cannot send.

Guests are told this honestly — they see *"This form is not connected yet, so
your request was NOT sent. Please call 904 402 9212"* — rather than a fake
"Thank you!". That is deliberate. But it means you are losing bookings.

To fix it:

1. Go to **[web3forms.com](https://web3forms.com)** and enter the email address
   that should receive bookings. It is free.
2. It gives you an **access key**.
3. **Info & hours** → *Online forms* → paste it → **Publish**.

That key is safe to have on a public website. It can only send email to the
address you registered with it.

### 2. Connect publishing

**Settings** → *Publishing to GitHub*:

| Field | Value |
|---|---|
| Owner | `Inova01` |
| Repository | `Resto_Sevenwonders` |
| Branch | `main` |

For the **token**: on GitHub go to **Settings → Developer settings → Personal
access tokens → Fine-grained tokens → Generate new token**, then:

- **Repository access:** *Only select repositories* → `Resto_Sevenwonders`
- **Permissions:** *Repository permissions → Contents → **Read and write***
- **Expiration:** set one. 90 days is sensible.

Paste it, press **Save**, then **Test connection**. It should say *"this token
can publish"*.

If you would rather not use a token at all, choose **Download the files** on the
Publish screen instead. It saves the changed files to your Downloads folder and
you (or anyone) upload them to the site's `content/` folder. Slower, but it
needs no account and always works.

### Confirm the details

The Overview screen lists things that were guessed when the site was built:

- **Opening hours** — the times in there are a plausible guess, not your real
  hours. Check them.
- **Email address** — blank. The site hides the email row until you add one.
- **Social links** — blank. The site hides each icon until you add its link.
  (They used to be shown as links that went nowhere.)

Correct anything wrong, then tick it off on **Info & hours → Confirm these are
right**.

---

## Who can open the dashboard

**Anyone who knows the address can open this page.** The website is a set of
plain files with no server behind it, so there is nowhere to put a real login.

That is less alarming than it sounds:

- The page **cannot change the website** without the publish token, and that
  token is stored only in the browser it was typed into. A stranger opening
  `admin.html` gets an editor that can publish nothing.
- **Preview** only affects their own browser.
- The page is marked "do not index" so it should not turn up in search results.

You can set a **PIN** in **Settings**. Be clear about what it buys you: it hides
the screen from someone who stumbles onto the URL. It is checked in the browser,
so a determined person can bypass it. It is a curtain, not a lock.

**If you want a real lock** — worth doing if more than one person has the link —
put the site behind [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)
(free for small teams) and restrict `/admin.html` to specific email addresses.
Alternatively, keep `admin.html` out of the deployed site and run it locally
with `python -m http.server` when you need it; everything works the same.

**Keep the token safe:** do not set it up on a shared or public computer. If one
ever leaks, delete it in GitHub settings and generate a new one — the old one
stops working immediately.

---

## When something looks wrong

**I published, but the site still shows the old text.**
Publishing commits the change; the site then rebuilds, which takes up to a
minute or two. Wait and reload. Nothing is lost. The Overview screen shows a
note for five minutes after publishing to remind you of this.

**"Somebody else changed the site while you were editing."**
Two people published at once, and nothing was saved so nothing was lost.
Reload the dashboard to pick up their changes, check yours are still what you
want, and publish again.

**My changes vanished.**
The draft lives in one browser. It is gone if you cleared browsing data, used a
different browser or device, or pressed *Discard*. There is no way to get it
back — publish when you finish a piece of work.

**A photo shows as a grey box with a fork.**
No photo is set for that item, or the file is not in `assets/gallery/`. The fork
placeholder is deliberate: better than a broken image.

**A screen says "This screen could not be drawn".**
Your unpublished work is still saved. Try another screen. If it keeps happening,
**Settings → Discard unpublished changes** clears it.

**The token stopped working.**
Fine-grained tokens expire. Generate a new one and paste it into Settings.

---

## For a developer

### How it fits together

```
content/*.js          the editable data — plain JS assigning into
                      window.SW_CONTENT (no fetch, so it works over
                      file:// as well as http)
      ↓
js/content.js         merges them into window.SW, applies a draft overlay
                      ONLY in preview mode, exposes shared helpers
      ↓
js/site-render.js     paints footers, contact page, shop, blog, homepage,
                      About page
js/menu-data.js       shim: window.SW_MENU, minus sold-out items
js/menu-render.js     the menu tabs + order builder (unchanged)
js/main.js            behaviour — must load AFTER site-render.js
```

```
admin.html
  js/admin/store.js   Draft (localStorage) · Serializer (data → file text)
                      · Publishers (GitHub / Download / Supabase)
  js/admin/app.js     the dashboard UI
```

Manager-entered text is written with `textContent` throughout, never
`innerHTML`, so nothing typed into the dashboard can inject markup into the
live site. Blog bodies are arrays of plain strings for the same reason.

### Publishing

The GitHub publisher builds **one commit** for all changed files via the git
data API (blobs → tree → commit → move ref). One commit means one Pages
deploy; the simpler contents API would make one commit per file and set off a
race of deploys. The ref is moved with `force: false`, so a concurrent push is
rejected rather than overwritten.

Only sections that actually differ are written, so a publish touches the
minimum number of files.

### Adding a field

1. Add it to the object in `content/<section>.js`.
2. Add a default to `DEFAULTS` in `js/content.js` — that is what stops a
   missing or malformed file taking the site down.
3. Render it in `js/site-render.js`.
4. Add an editor for it in the matching `view*()` function in
   `js/admin/app.js`, using the existing `textField` / `priceField` /
   `checkField` / `photoField` / `selectField` helpers.

### Moving to Supabase

The Supabase publisher is deliberately switched off, not unfinished. Two things
are needed before it should be enabled:

1. The table (SQL in the header comment of `js/admin/store.js`). Note the RLS
   policies: public **read**, writes for authenticated users only. Do not allow
   anonymous writes, or anyone could rewrite the menu.
2. `js/content.js` must read from Supabase instead of the `content/*.js` files.

Until step 2 is done, publishing to Supabase would save to the database while
the website carried on reading the files — which is worse than not offering it.
That is why it refuses.

### Field reference

**`content/settings.js`** — `brand{first,second,legalName,shortName}`,
`tagline`, `blurb`, `contact{address1,address2,phone,phoneDigits,email,mapQuery}`,
`hours[{day,open,close,closed}]` (Monday first, exactly 7),
`hoursNote`, `socials{instagram,facebook,twitter}` (empty hides the icon),
`forms{web3formsKey,fallbackNote}`, `verified{…}` (drives the Overview
checklist).

**`content/menu.js`** — `dailySpecial{mode:"auto"|"manual",itemId,discountPercent}`,
`featuredIds[3]`, `categories[{id,label,photo,subcats[{id,label,items[]}]}]`,
`drinks[]`, `desserts[]`.
A dish is `{id,name,desc,price,priceLabel,soldOut,badge,img}` — `price: null`
means "varies" and `priceLabel` is shown instead. Ids are permanent: the order
builder and the daily special key off them, so rename freely but do not reuse
an id.

**`content/shop.js`** — `sortOptions[]` (only options the code implements),
`products[{id,name,note,price,sale,inStock,img}]`. `sale: null` = not on sale.

**`content/gallery.js`** — `homepage[]` (7 paths, must also appear in `images`),
`images[{src,alt,hidden}]`.

**`content/blog.js`** — `homepageCount`, `posts[{id,title,category,date,excerpt,img,body[],published}]`.
`date` is ISO `yyyy-mm-dd`; `body` is an array of plain-text paragraphs.

**`content/about.js`** — `hero{eyebrow,title,image,imageAlt}`,
`intro{eyebrow,title,body[]}`, `founders{label,people[{name,role,photo,photoAlt}]}`
(empty `people` removes the block), `detail{photos[{src,alt}],body[],closing}`,
`visit{eyebrow,title,primaryCta,secondaryCta}`. Every `body` is an array of
plain-text paragraphs. The address and phone in the visit block come from
`settings`, not from here.

**`content/home.js`** — `hero`, `about{…,stats[]}`, `events{…,items[{title,date,time,genre,img}]}`,
`gallery`, `testimonials{…,items[{name,context,quote,stars,avatar}]}`,
`blogPreview`, `ctaBanner`, `menuOfDay`. `{accent}` in `hero.title` is replaced
by an apricot span. Empty `events.items` / `testimonials.items` hide their
sections.

### Preview mechanism

`?preview=1` sets a sessionStorage flag and layers the localStorage draft over
the published content; `?preview=0` clears it. A visitor never sees a draft even
in the same browser, because the flag is per-tab and set only by that query
string.

### Local development

```bash
cd seven-wonders
python -m http.server 8000
# site      http://localhost:8000
# dashboard http://localhost:8000/admin.html
```
