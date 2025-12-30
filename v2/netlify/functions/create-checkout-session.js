import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const PRICE_MAP = {
  creator_pass_monthly: process.env.STRIPE_PRICE_CREATOR_PASS_MONTHLY,
  motion_monthly: process.env.STRIPE_PRICE_MOTION_MONTHLY,
  takeover_viral_monthly: process.env.STRIPE_PRICE_TAKEOVER_VIRAL_MONTHLY,
  dj_toolkit_monthly: process.env.STRIPE_PRICE_DJ_TOOLKIT_MONTHLY,
  label_core_monthly: process.env.STRIPE_PRICE_LABEL_CORE_MONTHLY,
  label_pro_monthly: process.env.STRIPE_PRICE_LABEL_PRO_MONTHLY,
  owner_founder_access: process.env.STRIPE_PRICE_OWNER_FOUNDER_ACCESS,

  mixtape_hosting_starter: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER,
  mixtape_hosting_pro: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO,
  mixtape_hosting_elite: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE,

  social_starter_monthly: process.env.STRIPE_PRICE_SOCIAL_STARTER_MONTHLY,
  rotation_boost_campaign: process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN,
  homepage_feature_artist: process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST,

  starter_sponsor_monthly: process.env.STRIPE_PRICE_STARTER_SPONSOR_MONTHLY,
  sponsor_city_monthly: process.env.STRIPE_PRICE_SPONSOR_CITY_MONTHLY,
  sponsor_takeover_monthly: process.env.STRIPE_PRICE_SPONSOR_TAKEOVER_MONTHLY,

  ai_radio_intro: process.env.STRIPE_PRICE_AI_RADIO_INTRO,
  ai_feature_verse_kit: process.env.STRIPE_PRICE_AI_FEATURE_VERSE_KIT,
  ai_imaging_pack: process.env.STRIPE_PRICE_AI_IMAGING_PACK,
  ai_social_pack: process.env.STRIPE_PRICE_AI_SOCIAL_PACK,
  ai_launch_campaign: process.env.STRIPE_PRICE_AI_LAUNCH_CAMPAIGN,
  ai_epk: process.env.STRIPE_PRICE_AI_EPK,
  ai_label_brand_pack: process.env.STRIPE_PRICE_AI_LABEL_BRAND_PACK,
};

const SUBSCRIPTION_IDS = new Set([
  'creator_pass_monthly',
  'motion_monthly',
  'takeover_viral_monthly',
  'dj_toolkit_monthly',
  'label_core_monthly',
  'label_pro_monthly',
  'owner_founder_access',
  'social_starter_monthly',
  'starter_sponsor_monthly',
  'sponsor_city_monthly',
  'sponsor_takeover_monthly',
]);

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
    },
    body: JSON.stringify(payload),
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const { plan, feature } = body;
  const id = plan || feature;

  if (!id) return json(400, { error: 'Missing plan/feature id' });

  const price = PRICE_MAP[id];
  if (!price) return json(400, { error: `Unknown plan/feature: ${id}` });

  const origin = event.headers?.origin || event.headers?.Origin;
  const SITE_URL = process.env.SITE_URL || origin || 'http://localhost:5173';
  const isSubscription = SUBSCRIPTION_IDS.has(id);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{ price, quantity: 1 }],
      success_url: `${SITE_URL}/pricing.html?unlocked=${encodeURIComponent(id)}`,
      cancel_url: `${SITE_URL}/pricing.html?cancelled=${encodeURIComponent(id)}`,
      metadata: { tkfm_id: id, platform: 'TKFM_V2' },
    });

    return json(200, { url: session.url });
  } catch (err) {
    return json(500, {
      error: 'Stripe checkout failed',
      message: err?.message || 'Unknown error',
    });
  }
}
