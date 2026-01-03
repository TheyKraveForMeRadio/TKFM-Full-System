import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function normalizeKey(id) {
  return String(id || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch (e) {}

  const planId = String(payload.planId || payload.featureId || payload.id || '').trim();
  if (!planId) {
    return json(400, { ok: false, error: 'Missing planId', example: { planId: 'video_monthly_visuals' } });
  }

  const SITE_URL = (process.env.SITE_URL || '').trim();
  if (!SITE_URL) {
    return json(400, { ok: false, error: 'Missing SITE_URL env var (set to https://www.tkfmradio.com)' });
  }

  // Primary: STRIPE_PRICE_<LOOKUP_KEY>
  const envKey = 'STRIPE_PRICE_' + normalizeKey(planId);
  const priceId = (process.env[envKey] || '').trim();

  if (!priceId) {
    return json(400, {
      ok: false,
      error: `Missing env var ${envKey} for planId=${planId}`,
      example: `${envKey}=price_123`
    });
  }

  try {
    // Detect recurring vs one-time
    const price = await stripe.prices.retrieve(priceId);
    const isRecurring = !!price.recurring;
    const mode = isRecurring ? 'subscription' : 'payment';

    const baseUrl = SITE_URL.replace(/\/$/, '');
    const successUrl = `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/cancel.html`;

    const params = {
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      client_reference_id: planId,
      metadata: { planId, envKey, priceId, mode },
    };

    // IMPORTANT: for subscriptions, also attach planId to the subscription metadata
    // so we can later verify entitlements by listing active subscriptions.
    if (mode === 'subscription') {
      params.subscription_data = { metadata: { planId } };
    }

    const session = await stripe.checkout.sessions.create(params);

    return json(200, { ok: true, url: session.url, mode });
  } catch (e) {
    return json(500, { ok: false, error: e?.message || 'Stripe error', planId, envKey });
  }
}
