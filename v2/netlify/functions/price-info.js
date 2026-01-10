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
  const qs = event.queryStringParameters || {};
  const planId = String(qs.planId || '').trim();
  if (!planId) return json(400, { ok: false, error: 'Missing planId' });

  const key = 'STRIPE_PRICE_' + normalizeKey(planId);
  const priceId = process.env[key];

  if (!priceId) {
    return json(200, { ok: false, missing_env: key });
  }

  try {
    const price = await stripe.prices.retrieve(priceId);
    return json(200, {
      ok: true,
      planId,
      priceId,
      unit_amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring ? price.recurring.interval : null,
      type: price.type || null,
    });
  } catch (e) {
    return json(200, { ok: false, error: e?.message || 'Stripe error', priceId });
  }
}
