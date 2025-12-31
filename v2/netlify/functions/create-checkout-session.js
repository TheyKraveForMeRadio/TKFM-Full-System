import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const PRICE_MAP = {
  // EXISTING: Monthly access tiers
  creator_pass_monthly: process.env.STRIPE_PRICE_CREATOR_PASS_MONTHLY,
  creator_pass_yearly: process.env.STRIPE_PRICE_CREATOR_PASS_YEARLY,
  motion_monthly: process.env.STRIPE_PRICE_MOTION_MONTHLY,
  takeover_viral_monthly: process.env.STRIPE_PRICE_TAKEOVER_VIRAL_MONTHLY,
  dj_toolkit_monthly: process.env.STRIPE_PRICE_DJ_TOOLKIT_MONTHLY,
  label_core_monthly: process.env.STRIPE_PRICE_LABEL_CORE_MONTHLY,
  label_pro_monthly: process.env.STRIPE_PRICE_LABEL_PRO_MONTHLY,
  owner_founder_access: process.env.STRIPE_PRICE_OWNER_FOUNDER_ACCESS,

  // EXISTING: Mixtape Hosting (one-time)
  mixtape_hosting_starter: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER,
  mixtape_hosting_pro: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO,
  mixtape_hosting_elite: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE,

  // EXISTING: Promo / Social / Sponsors
  social_starter_monthly: process.env.STRIPE_PRICE_SOCIAL_STARTER_MONTHLY,
  rotation_boost_campaign: process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN,
  homepage_feature_artist: process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST,
  starter_sponsor_monthly: process.env.STRIPE_PRICE_STARTER_SPONSOR_MONTHLY,
  sponsor_city_monthly: process.env.STRIPE_PRICE_SPONSOR_CITY_MONTHLY,
  sponsor_takeover_monthly: process.env.STRIPE_PRICE_SPONSOR_TAKEOVER_MONTHLY,

  // EXISTING: AI Feature Store (one-time)
  ai_radio_intro: process.env.STRIPE_PRICE_AI_RADIO_INTRO,
  ai_feature_verse_kit: process.env.STRIPE_PRICE_AI_FEATURE_VERSE_KIT,
  ai_imaging_pack: process.env.STRIPE_PRICE_AI_IMAGING_PACK,
  ai_social_pack: process.env.STRIPE_PRICE_AI_SOCIAL_PACK,
  ai_launch_campaign: process.env.STRIPE_PRICE_AI_LAUNCH_CAMPAIGN,
  ai_epk: process.env.STRIPE_PRICE_AI_EPK,
  ai_label_brand_pack: process.env.STRIPE_PRICE_AI_LABEL_BRAND_PACK,

  // NEW: AUTO ENGINES (monthly)
  autopilot_lite_monthly: process.env.STRIPE_PRICE_AUTOPILOT_LITE_MONTHLY,
  autopilot_pro_monthly: process.env.STRIPE_PRICE_AUTOPILOT_PRO_MONTHLY,
  ai_dj_autopilot_monthly: process.env.STRIPE_PRICE_AI_DJ_AUTOPILOT_MONTHLY,
  label_autopilot_monthly: process.env.STRIPE_PRICE_LABEL_AUTOPILOT_MONTHLY,
  sponsor_autopilot_monthly: process.env.STRIPE_PRICE_SPONSOR_AUTOPILOT_MONTHLY,

  // NEW: PRO FEATURE LANES (monthly)
  submissions_priority_monthly: process.env.STRIPE_PRICE_SUBMISSIONS_PRIORITY_MONTHLY,
  analytics_pro_monthly: process.env.STRIPE_PRICE_ANALYTICS_PRO_MONTHLY,
  contract_lab_pro_monthly: process.env.STRIPE_PRICE_CONTRACT_LAB_PRO_MONTHLY,
  distribution_assist_monthly: process.env.STRIPE_PRICE_DISTRIBUTION_ASSIST_MONTHLY,

  // NEW: ONE-TIME FEATURE PACKS
  priority_submission_pack: process.env.STRIPE_PRICE_PRIORITY_SUBMISSION_PACK,
  playlist_pitch_pack: process.env.STRIPE_PRICE_PLAYLIST_PITCH_PACK,
  press_run_pack: process.env.STRIPE_PRICE_PRESS_RUN_PACK,
  radio_interview_slot: process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT,
  homepage_takeover_day: process.env.STRIPE_PRICE_HOMEPAGE_TAKEOVER_DAY,
};

const SUBSCRIPTION_IDS = new Set([
  'creator_pass_monthly',
  'creator_pass_yearly',
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

  // NEW subscriptions
  'autopilot_lite_monthly',
  'autopilot_pro_monthly',
  'ai_dj_autopilot_monthly',
  'label_autopilot_monthly',
  'sponsor_autopilot_monthly',
  'submissions_priority_monthly',
  'analytics_pro_monthly',
  'contract_lab_pro_monthly',
  'distribution_assist_monthly',
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
  const SITE_URL = process.env.SITE_URL || origin || 'http://localhost:8888';

  const isSubscription = SUBSCRIPTION_IDS.has(id);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{ price, quantity: 1 }],
      success_url: `${SITE_URL}/pricing.html?unlocked=${encodeURIComponent(id)}`,
      cancel_url: `${SITE_URL}/pricing.html?cancelled=${encodeURIComponent(id)}`,
      metadata: { tkfm_id: id, platform: 'TKFM_V2', type: isSubscription ? 'subscription' : 'one_time' },
    });

    return json(200, { url: session.url });
  } catch (err) {
    return json(500, { error: 'Stripe checkout failed', message: err?.message || 'Unknown error' });
  }
}
