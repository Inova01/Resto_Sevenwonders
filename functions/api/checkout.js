import { SHOP_CATALOG, effectivePrice as effectiveShopPrice } from "../_shared/shop-catalog.js";
import { effectiveMenuPrice, findMenuProduct, pickDailySpecial } from "../_shared/menu-catalog.js";

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

function clientTotalCents(payload) {
  const raw = payload && (payload.clientTotal ?? payload.total);
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? moneyToCents(n) : NaN;
}

function cleanMetadata(value, max = 500) {
  return cleanText(value, max) || "Not provided";
}

function orderSummary(lineItems) {
  return lineItems.map((row) => {
    return `${row.qty} x ${row.product.name} @ $${row.amount.toFixed(2)}`;
  }).join("; ").slice(0, 500);
}

function appendLineItem(params, index, product, qty, amount, currency, origin) {
  params.set(`line_items[${index}][quantity]`, String(qty));
  params.set(`line_items[${index}][price_data][currency]`, currency);
  params.set(`line_items[${index}][price_data][unit_amount]`, String(moneyToCents(amount)));
  params.set(`line_items[${index}][price_data][product_data][name]`, cleanText(product.name, 120));
  params.set(`line_items[${index}][price_data][product_data][metadata][product_id]`, product.id);
  const description = product.note || product.desc || product.subcatLabel || "";
  if (description) {
    params.set(`line_items[${index}][price_data][product_data][description]`, cleanText(description, 500));
  }
  if (product.img) {
    params.append(`line_items[${index}][price_data][product_data][images][]`, new URL(product.img, origin).href);
  }
}

function checkoutUrls(request, env, source) {
  const url = new URL(request.url);
  const origin = url.origin;
  const page = source === "menu" ? "menu.html" : "shop.html";
  return {
    success: env.STRIPE_SUCCESS_URL || `${origin}/${page}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel: env.STRIPE_CANCEL_URL || `${origin}/${page}?checkout=cancel`
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
  const source = cleanText(payload.source || payload.checkoutSource || "shop", 20) === "menu" ? "menu" : "shop";
  const requested = normalizeCart(payload);
  const lineItems = [];
  const rejected = [];
  const now = new Date();

  requested.forEach(({ id, qty }) => {
    const product = source === "menu" ? findMenuProduct(id) : catalog.get(id);
    const amount = source === "menu" ? effectiveMenuPrice(product, now) : (product ? effectiveShopPrice(product) : null);
    const unavailable = source === "menu"
      ? !product || product.soldOut === true || !(Number(amount) > 0)
      : !product || product.inStock === false || !(Number(amount) > 0);
    if (unavailable) {
      rejected.push(id);
      return;
    }
    lineItems.push({ product, qty, amount });
  });

  if (!lineItems.length) {
    return json({ error: "No available products were found in the cart.", rejected }, 400);
  }

  const serverTotalCents = lineItems.reduce((sum, row) => sum + moneyToCents(row.amount) * row.qty, 0);
  const postedTotalCents = clientTotalCents(payload);
  if (postedTotalCents !== null && (!Number.isFinite(postedTotalCents) || postedTotalCents !== serverTotalCents)) {
    return json({
      error: "The order total changed.",
      detail: "Please refresh the page and try again. Prices are confirmed by the restaurant before payment."
    }, 409);
  }

  const url = new URL(request.url);
  const currency = cleanText(env.STRIPE_CURRENCY || "usd", 12).toLowerCase();
  const returnUrls = checkoutUrls(request, env, source);
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", returnUrls.success);
  params.set("cancel_url", returnUrls.cancel);
  params.set("billing_address_collection", "auto");
  params.set("phone_number_collection[enabled]", "true");
  params.set("allow_promotion_codes", "true");
  params.set("metadata[source]", "seven-wonders-website");
  params.set("metadata[checkout_source]", source);
  params.set("metadata[order_type]", cleanText(payload.orderType || (payload.customer && payload.customer.fulfillment) || "pickup", 40));
  params.set("metadata[item_count]", String(lineItems.reduce((sum, row) => sum + row.qty, 0)));
  params.set("metadata[order_summary]", orderSummary(lineItems));

  if (source === "menu") {
    const customer = payload.customer || {};
    const special = pickDailySpecial(now);
    params.set("metadata[customer_name]", cleanMetadata(customer.name, 120));
    params.set("metadata[customer_phone]", cleanMetadata(customer.phone, 80));
    params.set("metadata[customer_email]", cleanMetadata(customer.email, 120));
    params.set("metadata[fulfillment]", cleanMetadata(customer.fulfillment || payload.orderType || "Pickup", 40));
    params.set("metadata[pickup_time]", cleanMetadata(customer.time, 120));
    params.set("metadata[delivery_address]", cleanMetadata(customer.address, 200));
    params.set("metadata[notes]", cleanMetadata(customer.notes, 500));
    params.set("metadata[daily_special_id]", special ? special.id : "none");
    const email = cleanText(customer.email, 800);
    if (email) params.set("customer_email", email);
  }

  if (env.STRIPE_TAX_RATE_ID) {
    lineItems.forEach((_, i) => params.append(`line_items[${i}][tax_rates][]`, env.STRIPE_TAX_RATE_ID));
  }

  lineItems.forEach((row, index) => appendLineItem(params, index, row.product, row.qty, row.amount, currency, url.origin));

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

export async function onRequestGet({ env }) {
  const ready = !!(env && env.STRIPE_SECRET_KEY);
  return json({
    ok: true,
    paymentsAvailable: ready,
    webhookAvailable: !!(env && env.STRIPE_WEBHOOK_SECRET),
    message: ready
      ? "Stripe checkout endpoint is ready."
      : "Stripe checkout endpoint is ready. Add STRIPE_SECRET_KEY to accept payments."
  });
}
