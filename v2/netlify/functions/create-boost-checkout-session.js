import Stripe from 'stripe';

/**
 * TKFM: Dedicated Boost checkout endpoint (does NOT touch existing create-checkout-session.js)
 *
 * Accepts JSON body with any of:
 *  - planId / plan / id / lookup_key / priceLookupKey / feature
 * Expects lookup key:
 *  - rotation_boost_7d  -> STRIPE_PRICE_ROTATION_BOOST_7D
 *  - rotation_boost_30d -> STRIPE_PRICE_ROTATION_BOOST_30D
 */
export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ ok:false, error:'Method not allowed' }) };
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return { statusCode: 500, body: JSON.stringify({ ok:false, error:'Missing STRIPE_SECRET_KEY' }) };
    }
    const stripe = new Stripe(stripeKey);

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }

    const lookup =
      body.planId ||
      body.plan ||
      body.id ||
      body.lookup_key ||
      body.priceLookupKey ||
      body.feature ||
      body.data_plan ||
      body.dataPlan ||
      body.data_feature ||
      body.dataFeature ||
      '';

    if (!lookup || typeof lookup !== 'string') {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error:'Missing plan/lookup key' }) };
    }

    const priceId =
      lookup === 'rotation_boost_7d'
        ? process.env.STRIPE_PRICE_ROTATION_BOOST_7D
        : lookup === 'rotation_boost_30d'
          ? process.env.STRIPE_PRICE_ROTATION_BOOST_30D
          : null;

    if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok:false,
          error:'Boost price env missing',
          lookup,
          expectedEnv: lookup === 'rotation_boost_7d' ? 'STRIPE_PRICE_ROTATION_BOOST_7D' : (lookup === 'rotation_boost_30d' ? 'STRIPE_PRICE_ROTATION_BOOST_30D' : 'UNKNOWN'),
        }),
      };
    }

    const headers = event.headers || {};
    const proto = headers['x-forwarded-proto'] || 'https';
    const host = headers.host || headers.Host || '';
    const origin = host ? `${proto}://${host}` : (headers.origin || headers.Origin || '');

    // If you have a post-checkout page, send users there; otherwise fallback to rotation-boost.
    const successPath = '/post-checkout.html';
    const cancelPath = '/rotation-boost.html';

    const success_url = `${origin}${successPath}?plan=${encodeURIComponent(lookup)}&session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${origin}${cancelPath}?canceled=1&plan=${encodeURIComponent(lookup)}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      // Optional metadata to help you reconcile in webhooks
      metadata: {
        tkfm_lane: 'rotation_boost',
        tkfm_lookup: lookup,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok:true, id: session.id, url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok:false, error: String(err?.message || err || 'Unknown error') }),
    };
  }
}
