import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function normalizeKey(id) {
  return String(id || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch (e) {}

  const planId = String(payload.planId || payload.lookup_key || payload.id || '').trim();
  if (!planId) return json(400, { ok: false, error: 'Missing planId' });

  const key = 'STRIPE_PRICE_' + normalizeKey(planId);
  const price = process.env[key];

  if (!price) {
    return json(400, {
      ok: false,
      error: `Missing env var ${key}`,
      example: 'Set it in Netlify env vars to your Stripe Price ID (price_...).',
    });
  }

  const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');
  if (!SITE_URL) return json(500, { ok: false, error: 'Missing SITE_URL env var' });

  const isSub = /_MONTHLY\b/i.test(planId);
  const mode = isSub ? 'subscription' : 'payment';

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cancel.html`,
      metadata: { feature_id: planId },
      ...(isSub
        ? { subscription_data: { metadata: { feature_id: planId } } }
        : {}),
    });

    return json(200, { ok: true, url: session.url, id: session.id, mode, planId });
  } catch (e) {
    return json(500, { ok: false, error: e?.message || 'Stripe error' });
  }
}
