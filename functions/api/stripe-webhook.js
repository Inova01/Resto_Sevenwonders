const TOLERANCE_SECONDS = 300;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function hex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256(secret, payload) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}

function parseStripeSignature(header) {
  const parts = String(header || "").split(",");
  const parsed = { t: "", v1: [] };
  parts.forEach((part) => {
    const [key, value] = part.split("=");
    if (key === "t") parsed.t = value || "";
    if (key === "v1" && value) parsed.v1.push(value);
  });
  return parsed;
}

async function verifyStripeSignature(payload, header, secret) {
  const sig = parseStripeSignature(header);
  const ts = Number(sig.t);
  if (!ts || !sig.v1.length) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > TOLERANCE_SECONDS) return false;

  const expected = await hmacSha256(secret, `${sig.t}.${payload}`);
  return sig.v1.some((candidate) => timingSafeEqual(candidate, expected));
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: "Stripe webhook signing secret is not configured." }, 503);
  }

  const payload = await request.text();
  const verified = await verifyStripeSignature(payload, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
  if (!verified) return json({ error: "Invalid Stripe signature." }, 400);

  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    return json({ error: "Invalid JSON payload." }, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data && event.data.object;
    console.log("[Seven Wonders] paid checkout", {
      id: session && session.id,
      amount_total: session && session.amount_total,
      customer_email: session && session.customer_details && session.customer_details.email,
      metadata: session && session.metadata
    });
  }

  return json({ received: true });
}

export async function onRequestGet() {
  return json({ ok: true, message: "Stripe webhook endpoint is ready for signed POST events." });
}

