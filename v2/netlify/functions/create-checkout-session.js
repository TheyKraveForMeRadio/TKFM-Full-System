import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// data-plan id -> Stripe Price env var
const PRICE_MAP = {
  // SUBSCRIPTIONS (monthly access)
  creator_pass_monthly: process.env.STRIPE_PRICE_CREATOR_PASS_MONTHLY,
  motion_monthly: process.env.STRIPE_PRICE_MOTION_MONTHLY,
  takeover_viral_monthly: process.env.STRIPE_PRICE_TAKEOVER_VIRAL_MONTHLY,
  dj_toolkit_monthly: process.env.STRIPE_PRICE_DJ_TOOLKIT_MONTHLY,
  label_core_monthly: process.env.STRIPE_PRICE_LABEL_CORE_MONTHLY,
  label_pro_monthly: process.env.STRIPE_PRICE_LABEL_PRO_MONTHLY,
  autopilot_lite_monthly: process.env.STRIPE_PRICE_AUTOPILOT_LITE_MONTHLY,
  autopilot_pro_monthly: process.env.STRIPE_PRICE_AUTOPILOT_PRO_MONTHLY,
  contract_lab_pro_monthly: process.env.STRIPE_PRICE_CONTRACT_LAB_PRO_MONTHLY,
  label_autopilot_monthly: process.env.STRIPE_PRICE_LABEL_AUTOPILOT_MONTHLY,
  sponsor_autopilot_monthly: process.env.STRIPE_PRICE_SPONSOR_AUTOPILOT_MONTHLY,
  submissions_priority_monthly: process.env.STRIPE_PRICE_SUBMISSIONS_PRIORITY_MONTHLY,
  analytics_pro_monthly: process.env.STRIPE_PRICE_ANALYTICS_PRO_MONTHLY,
  social_starter_monthly: process.env.STRIPE_PRICE_SOCIAL_STARTER_MONTHLY,
  ai_dj_autopilot_monthly: process.env.STRIPE_PRICE_AI_DJ_AUTOPILOT_MONTHLY,

  // ONE-TIME (payments)
  mixtape_hosting_starter: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER,
  mixtape_hosting_pro: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO,
  mixtape_hosting_elite: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE,
  rotation_boost_campaign: process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN,
  homepage_feature_artist: process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST,
  homepage_takeover_day: process.env.STRIPE_PRICE_HOMEPAGE_TAKEOVER_DAY,
  radio_interview_slot: process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT,
  priority_submission_pack: process.env.STRIPE_PRICE_PRIORITY_SUBMISSION_PACK,
  press_run_pack: process.env.STRIPE_PRICE_PRESS_RUN_PACK,
  playlist_pitch_pack: process.env.STRIPE_PRICE_PLAYLIST_PITCH_PACK,

  // AI / add-ons
  ai_feature_verse_kit: process.env.STRIPE_PRICE_AI_FEATURE_VERSE_KIT,
  ai_imaging_pack: process.env.STRIPE_PRICE_AI_IMAGING_PACK,
  ai_label_brand_pack: process.env.STRIPE_PRICE_AI_LABEL_BRAND_PACK,
  ai_launch_campaign: process.env.STRIPE_PRICE_AI_LAUNCH_CAMPAIGN,
  ai_radio_intro: process.env.STRIPE_PRICE_AI_RADIO_INTRO,
  ai_social_pack: process.env.STRIPE_PRICE_AI_SOCIAL_PACK
};

// Explicit mode map. Fallback: *_monthly => subscription else payment.
const MODE_MAP = {
  creator_pass_monthly: 'subscription',
  motion_monthly: 'subscription',
  takeover_viral_monthly: 'subscription',
  dj_toolkit_monthly: 'subscription',
  label_core_monthly: 'subscription',
  label_pro_monthly: 'subscription',
  autopilot_lite_monthly: 'subscription',
  autopilot_pro_monthly: 'subscription',
  contract_lab_pro_monthly: 'subscription',
  label_autopilot_monthly: 'subscription',
  sponsor_autopilot_monthly: 'subscription',
  submissions_priority_monthly: 'subscription',
  analytics_pro_monthly: 'subscription',
  social_starter_monthly: 'subscription',
  ai_dj_autopilot_monthly: 'subscription',

  mixtape_hosting_starter: 'payment',
  mixtape_hosting_pro: 'payment',
  mixtape_hosting_elite: 'payment',
  rotation_boost_campaign: 'payment',
  homepage_feature_artist: 'payment',
  homepage_takeover_day: 'payment',
  radio_interview_slot: 'payment',
  priority_submission_pack: 'payment',
  press_run_pack: 'payment',
  playlist_pitch_pack: 'payment',
  ai_feature_verse_kit: 'payment',
  ai_imaging_pack: 'payment',
  ai_label_brand_pack: 'payment',
  ai_launch_campaign: 'payment',
  ai_radio_intro: 'payment',
  ai_social_pack: 'payment'
};

function json(statusCode, bodyObj) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(bodyObj) };
}

function baseUrl(event) {
  const site = String(process.env.SITE_URL || '').trim();
  if (site.startsWith('http://') || site.startsWith('https://')) return site.replace(/\/+$/, '');

  const origin = String(event?.headers?.origin || '').trim();
  if (origin.startsWith('http://') || origin.startsWith('https://')) return origin.replace(/\/+$/, '');

  const host = String(event?.headers?.host || '').trim();
  if (host) return 'http://' + host;

  return 'http://localhost:8888';
}

function modeFor(planId) {
  if (MODE_MAP[planId]) return MODE_MAP[planId];
  if (String(planId || '').endsWith('_monthly')) return 'subscription';
  return 'payment';
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

    const body = event.body ? JSON.parse(event.body) : {};
    const planId = body.planId || body.plan || body.id || body.sku || body.lookup_key || null;
    const quantity = Math.max(1, Number(body.quantity || 1));

    if (!planId) return json(400, { ok: false, error: 'missing_planId' });

    const price = PRICE_MAP[planId];
    if (!price) return json(400, { ok: false, error: 'unknown_plan', planId });

    const base = baseUrl(event);
    const success_url = `${base}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${base}/pricing.html?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: modeFor(planId),
      line_items: [{ price, quantity }],
      allow_promotion_codes: true,
      success_url,
      cancel_url,
      metadata: { planId: String(planId), source: 'tkfm_v2' }
    });

    return json(200, { ok: true, url: session.url, id: session.id });
  } catch (e) {
    return json(500, { ok: false, error: 'create_session_failed', message: String(e?.message || e) });
  }
}
