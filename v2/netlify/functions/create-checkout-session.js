import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

function json(body) {
  try { return body ? JSON.parse(body) : {}; } catch { return {}; }
}

function getOrigin(event) {
  const h = event.headers || {};
  const proto = (h['x-forwarded-proto'] || h['X-Forwarded-Proto'] || 'https').split(',')[0].trim();
  const host = (h['x-forwarded-host'] || h['X-Forwarded-Host'] || h.host || h.Host || '').split(',')[0].trim();
  if (host) return `${proto}://${host}`;
  if (process.env.URL) return process.env.URL;            // Netlify site URL
  if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL;
  return 'https://www.tkfmradio.com';
}

function normalizeKey(s) {
  return String(s || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function pickPlanId(event, payload) {
  const q = event.queryStringParameters || {};
  return (
    payload.planId || payload.plan || payload.feature || payload.id ||
    payload.lookup_key || payload.lookupKey ||
    q.planId || q.plan || q.feature || q.id || q.lookup_key || q.lookupKey ||
    ''
  ).toString().trim();
}

function mapPlanToPriceId(planId) {
  // If caller already passed a Stripe price id, accept it directly.
  if (typeof planId === 'string' && planId.startsWith('price_')) return planId;

  const k = normalizeKey(planId);
  if (!k) return '';

  const candidates = [
    `STRIPE_PRICE_${k}`,
    // common alias patterns:
    `STRIPE_PRICE_AI_${k}`,
    `STRIPE_PRICE_LABEL_${k}`,
    `STRIPE_PRICE_${k}_MONTHLY`,
    `STRIPE_PRICE_${k}_YEARLY`,
  ];

  // If planId already ends with _MONTHLY, try without and vice versa.
  if (k.endsWith('_MONTHLY')) candidates.push(`STRIPE_PRICE_${k.replace(/_MONTHLY$/, '')}`);
  else candidates.push(`STRIPE_PRICE_${k}_MONTHLY`);

  // Legacy/special cases (keeps platform stable)
  const legacy = {
    ROTATION_BOOST: 'STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN',
    ROTATION_BOOST_CAMPAIGN: 'STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN',
    TAKEOVER_SPONSOR_MONTHLY: 'STRIPE_PRICE_TAKEOVER_SPONSOR_MONTHLY',
    CITY_SPONSOR_MONTHLY: 'STRIPE_PRICE_CITY_SPONSOR_MONTHLY',
    STARTER_SPONSOR_MONTHLY: 'STRIPE_PRICE_STARTER_SPONSOR_MONTHLY',
    SPONSOR_CITY_MONTHLY: 'STRIPE_PRICE_SPONSOR_CITY_MONTHLY',
    SPONSOR_TAKEOVER_MONTHLY: 'STRIPE_PRICE_SPONSOR_TAKEOVER_MONTHLY',
  };
  if (legacy[k]) candidates.unshift(legacy[k]);

  for (const envName of candidates) {
    const val = process.env[envName];
    if (val && String(val).startsWith('price_')) return String(val).trim();
  }
  return '';
}

async function getOrCreateCustomer(email) {
  const clean = String(email || '').trim();
  if (!clean) return null;

  // Stripe search is available; but list is fine for most small volumes.
  const existing = await stripe.customers.list({ email: clean, limit: 1 });
  if (existing && existing.data && existing.data.length) return existing.data[0];

  return await stripe.customers.create({ email: clean });
}

export async function handler(event) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      return { statusCode: 500, body: JSON.stringify({ ok:false, error:'STRIPE_SECRET_KEY missing or invalid in environment.' }) };
    }

    const payload = json(event.body);
    const planId = pickPlanId(event, payload);
    if (!planId) return { statusCode: 400, body: JSON.stringify({ ok:false, error:'Missing planId.' }) };

    const priceId = mapPlanToPriceId(planId);
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error:`Missing Stripe price mapping for "${planId}". Check env vars.` }) };
    }

    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error:`Could not retrieve price "${priceId}". Check env var mapping and Stripe mode/account.`, stripeMessage: e?.message || String(e) }) };
    }

    const origin = getOrigin(event);
    const success = `${origin}/post-checkout.html?session_id={CHECKOUT_SESSION_ID}&planId=${encodeURIComponent(planId)}`;
    const cancel = `${origin}/pricing.html?canceled=1`;

    const mode = price?.recurring ? 'subscription' : 'payment';

    const sessionParams = {
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success,
      cancel_url: cancel,
      // Let users enter tax/email/address in Checkout as needed.
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
    };

    // IMPORTANT FIX:
    // Stripe Checkout forbids setting BOTH `customer` and `customer_email`.
    // We always attach a `customer` when an email is provided.
    const email = (payload.email || payload.customer_email || payload.customerEmail || '').toString().trim();
    if (email) {
      const customer = await getOrCreateCustomer(email);
      if (customer?.id) sessionParams.customer = customer.id;
      // DO NOT set customer_email when customer is set.
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return { statusCode: 200, body: JSON.stringify({ ok:true, url: session.url }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: e?.message || String(e) }) };
  }
}
