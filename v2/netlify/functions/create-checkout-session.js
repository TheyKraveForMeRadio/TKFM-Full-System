import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CATALOG = {
  // MEMBERSHIPS (SUBSCRIPTIONS)
  creator_pass_monthly:   { priceEnv: 'STRIPE_PRICE_CREATOR_PASS_MONTHLY',   mode: 'subscription', unlock: { tier: 'creator', features: ['creator_pass'] } },
  creator_pass_yearly:    { priceEnv: 'STRIPE_PRICE_CREATOR_PASS_YEARLY',    mode: 'subscription', unlock: { tier: 'creator', features: ['creator_pass'] } },

  motion_monthly:         { priceEnv: 'STRIPE_PRICE_MOTION_MONTHLY',         mode: 'subscription', unlock: { tier: 'creator', features: ['social_engine','motion_monthly'] } },
  takeover_viral_monthly: { priceEnv: 'STRIPE_PRICE_TAKEOVER_VIRAL_MONTHLY', mode: 'subscription', unlock: { tier: 'creator', features: ['social_engine','takeover_viral_monthly'] } },

  dj_toolkit_monthly:     { priceEnv: 'STRIPE_PRICE_DJ_TOOLKIT_MONTHLY',     mode: 'subscription', unlock: { tier: 'dj',      features: ['dj_toolkit'] } },

  label_core_monthly:     { priceEnv: 'STRIPE_PRICE_LABEL_CORE_MONTHLY',     mode: 'subscription', unlock: { tier: 'label',   features: ['label_core'] } },
  label_pro_monthly:      { priceEnv: 'STRIPE_PRICE_LABEL_PRO_MONTHLY',      mode: 'subscription', unlock: { tier: 'label',   features: ['label_pro'] } },

  // MIXTAPE HOSTING (ONE-TIME)
  mixtape_hosting_starter:{ priceEnv: 'STRIPE_PRICE_MIXTAPE_HOSTING_STARTER',mode: 'payment',      unlock: { features: ['mixtape_hosting_starter'] } },
  mixtape_hosting_pro:    { priceEnv: 'STRIPE_PRICE_MIXTAPE_HOSTING_PRO',    mode: 'payment',      unlock: { features: ['mixtape_hosting_pro'] } },
  mixtape_hosting_elite:  { priceEnv: 'STRIPE_PRICE_MIXTAPE_HOSTING_ELITE',  mode: 'payment',      unlock: { features: ['mixtape_hosting_elite'] } },

  // PROMO / ROTATION (ONE-TIME)
  rotation_boost_light:   { priceEnv: 'STRIPE_PRICE_ROTATION_BOOST_LIGHT',   mode: 'payment',      unlock: { features: ['rotation_boost_light'] } },
  rotation_boost_heavy:   { priceEnv: 'STRIPE_PRICE_ROTATION_BOOST_HEAVY',   mode: 'payment',      unlock: { features: ['rotation_boost_heavy'] } },
  rotation_boost_full:    { priceEnv: 'STRIPE_PRICE_ROTATION_BOOST_FULL',    mode: 'payment',      unlock: { features: ['rotation_boost_full'] } },

  // SOCIAL (SUBSCRIPTION)
  social_starter_monthly: { priceEnv: 'STRIPE_PRICE_SOCIAL_STARTER_MONTHLY', mode: 'subscription', unlock: { tier: 'creator', features: ['social_engine','social_starter_monthly'] } }
};

function getOrigin(headers = {}) {
  const proto = headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'] || 'https';
  const host = headers['host'] || headers['Host'];
  if (!host) return 'https://www.tkfmradio.com';
  return `${proto}://${host}`;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');
    const id = body.id || body.planId || body.featureId;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing id' }) };

    const item = CATALOG[id];
    if (!item) return { statusCode: 400, body: JSON.stringify({ error: 'Unknown id', id }) };

    const price = process.env[item.priceEnv];
    if (!price) return { statusCode: 500, body: JSON.stringify({ error: 'Missing env price', env: item.priceEnv }) };

    const origin = getOrigin(event.headers || {});
    const success_url = `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${origin}/cancel.html`;

    const session = await stripe.checkout.sessions.create({
      mode: item.mode,
      allow_promotion_codes: true,
      line_items: [{ price, quantity: 1 }],
      success_url,
      cancel_url,
      metadata: {
        unlock_id: id,
        unlock_json: JSON.stringify(item.unlock || {})
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
}
