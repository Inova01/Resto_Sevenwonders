import { SHOP_CATALOG, effectivePrice } from "../_shared/shop-catalog.js";

const MAX_DISTINCT_ITEMS = 40;
const MAX_QTY_PER_ITEM = 20;
const STRIPE_CHECKOUT_URL = "https://api.stripe.com/v1/checkout/sessions";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function moneyToCents(value) {
  return Math.round(Number(value) * 100);
}

function cleanText(value, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function productMap() {
  const out = new Map();
  SHOP_CATALOG.forEach((product) => out.set(product.id, product));
  return out;
}

function normalizeCart(payload) {
  const source = Array.isArray(payload && payload.items) ? payload.items : [];
  const quantities = new Map();

  source.slice(0, MAX_DISTINCT_ITEMS).forEach((item) => {
    const id = cleanText(item && item.id, 120);
    const qty = Math.max(0, Math.min(MAX_QTY_PER_ITEM, Math.floor(Number(item && item.qty) || 0)));
    if (!id || !qty) return;
    quantities.set(id, Math.min(MAX_QTY_PER_ITEM, (quantities.get(id) || 0) + qty));
  });

  return Array.from(quantities, ([id, qty]) => ({ id, qty }));
}

function appendLineItem(params, index, product, qty, currency, origin) {
  const amount = moneyToCents(effectivePrice(product));
  params.set(`line_items[${index}][quantity]`, String(qty));
  params.set(`line_items[${index}][price_data][currency]`, currency);
  params.set(`line_items[${index}][price_data][unit_amount]`, String(amount));
  params.set(`line_items[${index}][price_data][product_data][name]`, cleanText(product.name, 120));
  params.set(`line_items[${index}][price_data][product_data][metadata][product_id]`, product.id);
  if (product.note) {
    params.set(`line_items[${index}][price_data][product_data][description]`, cleanText(product.note, 500));
  }
  if (product.img) {
    params.append(`line_items[${index}][price_data][product_data][images][]`, new URL(product.img, origin).href);
  }
}

function checkoutUrls(request, env) {
  const url = new URL(request.url);
  const origin = url.origin;
  return {
    success: env.STRIPE_SUCCESS_URL || `${origin}/shop.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel: env.STRIPE_CANCEL_URL || `${origin}/shop.html?checkout=cancel`
  };
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) {
    return json({
      error: "Stripe is not connected yet.",
      detail: "Add STRIPE_SECRET_KEY in Cloudflare Pages Variables and Secrets."
    }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    return json({ error: "Send the cart as JSON." }, 400);
  }

  const catalog = productMap();
  const requested = normalizeCart(payload);
  const lineItems = [];
  const rejected = [];

  requested.forEach(({ id, qty }) => {
    const product = catalog.get(id);
    if (!product || product.inStock === false || !(Number(product.price) > 0)) {
      rejected.push(id);
      return;
    }
    lineItems.push({ product, qty });
  });

  if (!lineItems.length) {
    return json({ error: "No available products were found in the cart.", rejected }, 400);
  }

  const url = new URL(request.url);
  const currency = cleanText(env.STRIPE_CURRENCY || "usd", 12).toLowerCase();
  const returnUrls = checkoutUrls(request, env);
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", returnUrls.success);
  params.set("cancel_url", returnUrls.cancel);
  params.set("billing_address_collection", "auto");
  params.set("phone_number_collection[enabled]", "true");
  params.set("allow_promotion_codes", "true");
  params.set("metadata[source]", "seven-wonders-website");
  params.set("metadata[order_type]", cleanText(payload.orderType || "pickup", 40));
  params.set("metadata[item_count]", String(lineItems.reduce((sum, row) => sum + row.qty, 0)));
  if (env.STRIPE_TAX_RATE_ID) {
    lineItems.forEach((_, i) => params.append(`line_items[${i}][tax_rates][]`, env.STRIPE_TAX_RATE_ID));
  }

  lineItems.forEach((row, index) => appendLineItem(params, index, row.product, row.qty, currency, url.origin));

  const stripeRes = await fetch(STRIPE_CHECKOUT_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const stripeText = await stripeRes.text();
  let stripeJson = {};
  try { stripeJson = JSON.parse(stripeText); } catch (err) {}

  if (!stripeRes.ok) {
    return json({
      error: "Stripe could not start checkout.",
      detail: (stripeJson.error && stripeJson.error.message) || "Please try again or call the restaurant."
    }, 502);
  }

  return json({ id: stripeJson.id, url: stripeJson.url, rejected });
}

export async function onRequestGet() {
  return json({ ok: true, message: "Stripe checkout endpoint is ready. Send a POST cart to start payment." });
}

