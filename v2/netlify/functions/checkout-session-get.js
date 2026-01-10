import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,OPTIONS",
    },
    body: JSON.stringify(obj),
  };
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
    if (event.httpMethod !== "GET") return json(405, { ok: false, error: "Method not allowed" });

    if (!process.env.STRIPE_SECRET_KEY || !String(process.env.STRIPE_SECRET_KEY).startsWith("sk_")) {
      return json(500, { ok: false, error: "STRIPE_SECRET_KEY missing or invalid" });
    }

    const qs = event.queryStringParameters || {};
    const session_id = (qs.session_id || qs.sessionId || "").trim();
    if (!session_id) return json(400, { ok: false, error: "Missing session_id" });

    const s = await stripe.checkout.sessions.retrieve(session_id);

    return json(200, {
      ok: true,
      id: s.id,
      mode: s.mode,
      status: s.status,
      payment_status: s.payment_status,
      amount_total: s.amount_total,
      currency: s.currency,
      customer: s.customer,
      metadata: s.metadata || {},
    });
  } catch (e) {
    return json(500, { ok: false, error: "Stripe retrieve failed", stripeMessage: e?.message || String(e) });
  }
}
