# Tests

Two harnesses. Neither is part of the website — nothing in `tests/` is loaded by
any page, so they cost visitors nothing.

## `check-content.js` — no dependencies

```bash
node tests/check-content.js
```

58 checks on the content layer. Runs the real `content/*.js` and `js/content.js`
in a minimal fake browser and asserts the things that would actually break the
site:

- every image path referenced anywhere exists on disk (85 of them)
- dish ids are unique; `featuredIds` and the pinned daily special resolve
- every homepage photo is in the gallery list
- the sold-out filter in `js/menu-data.js` removes the dish *and* drops a group
  once everything in it is sold out
- the serializer round-trips: `data → file text → eval → identical data`, for
  all six sections, accents included
- change detection queues only the files that actually differ
- **a visitor does not see an unpublished draft, and `?preview=1` does**

Run this after editing anything in `content/` by hand.

## `check-pages.js` — needs jsdom

```bash
npm install jsdom      # once, anywhere on the path
node tests/check-pages.js
```

115 checks. Renders each real page in jsdom, runs every one of the site's
scripts in document order, and asserts what a guest would see: the right
address in the footer, prices pulled from the menu, sections that hide
themselves when empty, the forms admitting they are not connected instead of
faking success, and the dashboard — every screen rendering, and an edit turning
into a valid publishable file.

It reads only rendered text, with `<script>` contents stripped, so a negative
assertion like *"no invented phone number anywhere"* cannot accidentally match
the source code of the scripts themselves.

## What is not covered

The GitHub publish path is **not** exercised — it needs a real token and would
push a real commit. `verify()` in the dashboard (Settings → Test connection) is
the way to check that end for real.
