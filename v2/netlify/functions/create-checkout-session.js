import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function corsHeaders(event) {
  // Allow cross-origin calls for local dev previews (7777 -> 9999) and simple deployments.
  // If you want to lock this down later, replace '*' with your domain(s).
  const origin = (event && event.headers && (event.headers.origin || event.headers.Origin)) || '*';
  return {
    'access-control-allow-origin': origin === '' ? '*' : origin,
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization, x-tkfm-owner-key, x-tkfm-owner, x-owner-key',
    'access-control-max-age': '86400',
    'vary': 'Origin',
  };
}


/**
 * TKFM checkout resolver:
 * - Primary: resolve Stripe Price by lookup_key (same as data-plan / data-feature ids)
 * - Optional: allow direct price id if request provides priceId (admin/debug)
 *
 * This avoids stuffing dozens of STRIPE_PRICE_* env vars into Netlify (4KB Lambda env limit).
 */

function jsonBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch {
    return {};
  }
}

function pickOrigin(event) {
  const h = event.headers || {};
  const origin =
    h.origin ||
    (h.referer ? new URL(h.referer).origin : '') ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.DEPLOY_URL ||
    'https://tkfmradio.com';
  return origin;
}

function bad(event, statusCode, msg, extra = {}) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', ...corsHeaders(event) },
    body: JSON.stringify({ ok: false, error: msg, ...extra }),
  };
}

async function resolvePrice({ lookupKey, priceId }) {
  // Allow direct price id if explicitly provided
  if (priceId && typeof priceId === 'string' && priceId.startsWith('price_')) {
    const p = await stripe.prices.retrieve(priceId);
    return p || null;
  }

  if (!lookupKey || typeof lookupKey !== 'string') return null;

  const res = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
    active: true,
  });

  return res?.data?.[0] || null;
}

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(event), body: '' };
  }

  if (event.httpMethod !== 'POST') return bad(event, 405, 'Method not allowed');

  if (!process.env.STRIPE_SECRET_KEY) {
    return bad(event, 500, 'Missing STRIPE_SECRET_KEY in Netlify env');
  }

  const body = jsonBody(event);

  // Frontend sends one of these:
  // - planId (data-plan)  e.g. creator_pass_monthly
  // - featureId (data-feature) e.g. rotation_boost_7d
  // - lookupKey explicit
  const planId = body.planId || body.plan || null;
  const featureId = body.featureId || body.feature || null;
  const lookupKey = body.lookupKey || body.lookup_key || planId || featureId || null;

  const priceId = body.priceId || body.price || null;

  let price;
  try {
    price = await resolvePrice({ lookupKey, priceId });
  } catch (e) {
    return bad(event, 400, 'Could not resolve Stripe price', { lookupKey, message: e?.message || String(e) });
  }

  if (!price?.id) {
    return bad(event, 400, 'Could not resolve Stripe price', {
      lookupKey,
      hint: 'Ensure a Stripe Price exists with lookup_key == the plan/feature id (live vs test must match STRIPE_SECRET_KEY).',
    });
  }

  const origin = pickOrigin(event);

  // Optional: preserve a deep link so post-checkout can route the user
  const continueTo = body.continueTo || body.continue_to || '';

  // IMPORTANT: recurring prices require mode=subscription
  const mode = price.recurring ? 'subscription' : 'payment';

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url:
        `${origin}/post-checkout.html?session_id={CHECKOUT_SESSION_ID}` +
        (continueTo ? `&continueTo=${encodeURIComponent(continueTo)}` : ''),
      cancel_url: `${origin}/pricing.html?canceled=1`,
      metadata: {
        tkfm_plan_id: String(planId || ''),
        tkfm_feature_id: String(featureId || ''),
        tkfm_lookup_key: String(lookupKey || ''),
        tkfm_continue_to: String(continueTo || ''),
      },
    });

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', ...corsHeaders(event) },
      body: JSON.stringify({ ok: true, url: session.url, id: session.id, mode }),
    };
  } catch (e) {
    return bad(event, 500, 'Stripe checkout create failed', { message: e?.message || String(e), mode });
  }
}
