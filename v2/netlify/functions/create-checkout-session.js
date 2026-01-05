import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * TKFM CHECKOUT RESOLVER (fix Netlify/Lambda 4KB env limit)
 *
 * Goal:
 * - STOP depending on dozens of STRIPE_PRICE_* env vars (which breaks Netlify deploy)
 * - Prefer Stripe lookup_key = planId (or explicit lookup_key passed in)
 * - Keep backwards compatibility: if STRIPE_PRICE_* exists, still use it
 *
 * Accepted request body (JSON):
 * {
 *   "planId": "rotation_boost_7d" | "creator_pass_monthly" | ...
 *   "lookup_key": "rotation_boost_7d" (optional)
 *   "priceId": "price_..." (optional)
 *   "quantity": 1 (optional)
 *   "mode": "payment"|"subscription" (optional)
 *   "success_url": "https://.../post-checkout.html?session_id={CHECKOUT_SESSION_ID}" (optional)
 *   "cancel_url": "https://.../pricing.html" (optional)
 *   "metadata": { ... } (optional)
 * }
 */

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(obj),
  };
}

function sanitizeEnvKey(planId = '') {
  return String(planId)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function inferMode(planId = '', requested) {
  if (requested === 'payment' || requested === 'subscription') return requested;
  const id = String(planId || '');
  if (/(_MONTHLY|_YEARLY)$/i.test(id)) return 'subscription';
  if (/MONTHLY|YEARLY/i.test(id)) return 'subscription';
  return 'payment';
}

async function resolvePriceId({ planId, lookup_key, priceId }) {
  // direct price id wins
  if (priceId && String(priceId).startsWith('price_')) return String(priceId);

  const pid = String(planId || '').trim();
  const lkp = String(lookup_key || '').trim() || pid;

  // env var convention (keeps legacy wiring working)
  if (pid) {
    const envKey = `STRIPE_PRICE_${sanitizeEnvKey(pid)}`;
    if (process.env[envKey]) return String(process.env[envKey]);
  }

  // explicit boost env vars (kept minimal)
  if (pid === 'rotation_boost_7d' && process.env.STRIPE_PRICE_ROTATION_BOOST_7D) {
    return String(process.env.STRIPE_PRICE_ROTATION_BOOST_7D);
  }
  if (pid === 'rotation_boost_30d' && process.env.STRIPE_PRICE_ROTATION_BOOST_30D) {
    return String(process.env.STRIPE_PRICE_ROTATION_BOOST_30D);
  }

  // Stripe lookup_key (preferred)
  if (lkp) {
    const res = await stripe.prices.list({ lookup_keys: [lkp], limit: 1 });
    const found = res?.data?.[0]?.id;
    if (found) return found;
  }

  return '';
}

export async function handler(event) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return json(500, { ok: false, error: 'Missing STRIPE_SECRET_KEY' });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const planId = body.planId || body.plan || body.lookupKey || body.lookup_key || '';
    const lookup_key = body.lookup_key || body.lookupKey || '';
    const priceId = body.priceId || body.price || '';
    const quantity = Number(body.quantity || 1) || 1;

    const resolvedPriceId = await resolvePriceId({ planId, lookup_key, priceId });
    if (!resolvedPriceId) {
      return json(400, {
        ok: false,
        error: 'Price not resolved',
        planId,
        hint:
          'Create a Stripe Price with lookup_key = planId (ex: rotation_boost_7d) OR set STRIPE_PRICE_<PLANID> env var.',
      });
    }

    const mode = inferMode(planId, body.mode);

    const origin =
      (event.headers && (event.headers.origin || event.headers.Origin)) ||
      (event.headers &&
      (event.headers.referer || event.headers.Referer)
        ? new URL(event.headers.referer || event.headers.Referer).origin
        : '') ||
      'https://tkfmradio.com';

    const success_url =
      body.success_url ||
      `${origin}/post-checkout.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url =
      body.cancel_url ||
      `${origin}/pricing.html`;

    const metadata = {
      tkfm_plan: String(planId || lookup_key || resolvedPriceId || ''),
      ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
    };

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: resolvedPriceId, quantity }],
      success_url,
      cancel_url,
      metadata,
    });

    return json(200, { ok: true, id: session.id, url: session.url });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}
