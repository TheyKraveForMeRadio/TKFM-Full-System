import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function getSiteUrl(event) {
  const envUrl =
    (process.env.SITE_URL && String(process.env.SITE_URL).trim()) ||
    (process.env.URL && String(process.env.URL).trim());

  if (envUrl) return envUrl.replace(/\/+$/, '');

  const origin =
    event?.headers?.origin ||
    event?.headers?.Origin ||
    (event?.headers?.referer
      ? String(event.headers.referer).split('/').slice(0, 3).join('/')
      : '');

  return String(origin || 'http://localhost:8888').replace(/\/+$/, '');
}

function looksLikeSubscription(id) {
  return /_(monthly|yearly)$/.test(id);
}

// data-plan id -> Netlify ENV that holds Stripe price id (price_...)
const PRICE_MAP = {
  // ACCESS
  creator_pass_monthly: process.env.STRIPE_PRICE_CREATOR_PASS_MONTHLY,
  creator_pass_yearly: process.env.STRIPE_PRICE_CREATOR_PASS_YEARLY,
  motion_monthly: process.env.STRIPE_PRICE_MOTION_MONTHLY,
  takeover_viral_monthly: process.env.STRIPE_PRICE_TAKEOVER_VIRAL_MONTHLY,
  dj_toolkit_monthly: process.env.STRIPE_PRICE_DJ_TOOLKIT_MONTHLY,

  // LABEL
  label_core_monthly: process.env.STRIPE_PRICE_LABEL_CORE_MONTHLY,
  label_pro_monthly: process.env.STRIPE_PRICE_LABEL_PRO_MONTHLY,
  label_autopilot_monthly: process.env.STRIPE_PRICE_LABEL_AUTOPILOT_MONTHLY,

  // AUTOPILOT / ANALYTICS / AI DJ AUTOPILOT
  autopilot_lite_monthly: process.env.STRIPE_PRICE_AUTOPILOT_LITE_MONTHLY,
  autopilot_pro_monthly: process.env.STRIPE_PRICE_AUTOPILOT_PRO_MONTHLY,
  analytics_pro_monthly: process.env.STRIPE_PRICE_ANALYTICS_PRO_MONTHLY,
  ai_dj_autopilot_monthly: process.env.STRIPE_PRICE_AI_DJ_AUTOPILOT_MONTHLY,

  // CONTRACT / DISTRIBUTION
  contract_lab_pro_monthly: process.env.STRIPE_PRICE_CONTRACT_LAB_PRO_MONTHLY,
  distribution_assist_monthly: process.env.STRIPE_PRICE_DISTRIBUTION_ASSIST_MONTHLY,

  // MIXTAPE HOSTING (one-time)
  mixtape_hosting_starter: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER,
  mixtape_hosting_pro: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO,
  mixtape_hosting_elite: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE,

  // SOCIAL / ROTATION / HOMEPAGE
  social_starter_monthly: process.env.STRIPE_PRICE_SOCIAL_STARTER_MONTHLY,
  rotation_boost_campaign: process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN,
  homepage_feature_artist: process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST,
  homepage_takeover_day: process.env.STRIPE_PRICE_HOMEPAGE_TAKEOVER_DAY,

  // SUBMISSIONS / PRIORITY
  submissions_priority_monthly: process.env.STRIPE_PRICE_SUBMISSIONS_PRIORITY_MONTHLY,
  priority_submission_pack: process.env.STRIPE_PRICE_PRIORITY_SUBMISSION_PACK,

  // PRESS / PLAYLIST / INTERVIEW (one-time)
  press_run_pack: process.env.STRIPE_PRICE_PRESS_RUN_PACK,
  playlist_pitch_pack: process.env.STRIPE_PRICE_PLAYLIST_PITCH_PACK,
  radio_interview_slot: process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT,

  // SPONSORS
  starter_sponsor_monthly: process.env.STRIPE_PRICE_STARTER_SPONSOR_MONTHLY,
  sponsor_city_monthly: process.env.STRIPE_PRICE_SPONSOR_CITY_MONTHLY,
  sponsor_takeover_monthly: process.env.STRIPE_PRICE_SPONSOR_TAKEOVER_MONTHLY,
  sponsor_autopilot_monthly: process.env.STRIPE_PRICE_SPONSOR_AUTOPILOT_MONTHLY,

  // AI PRODUCTS (one-time unless your Stripe price is recurring)
  ai_social_pack: process.env.STRIPE_PRICE_AI_SOCIAL_PACK,
  ai_radio_intro: process.env.STRIPE_PRICE_AI_RADIO_INTRO,
  ai_label_brand_pack: process.env.STRIPE_PRICE_AI_LABEL_BRAND_PACK,
  ai_imaging_pack: process.env.STRIPE_PRICE_AI_IMAGING_PACK,
  ai_feature_verse_kit: process.env.STRIPE_PRICE_AI_FEATURE_VERSE_KIT,
  ai_launch_campaign: process.env.STRIPE_PRICE_AI_LAUNCH_CAMPAIGN,

  // OWNER (block Stripe checkout)
  owner_founder_access: process.env.STRIPE_PRICE_OWNER_FOUNDER_ACCESS,
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const id = String(body.id || body.plan || '').trim();
    if (!id) return json(400, { error: 'Missing id' });

    // Never allow public Stripe checkout for owner access
    if (id === 'owner_founder_access') {
      return json(400, { error: 'Owner access is not a public Stripe product.', id });
    }

    const price = PRICE_MAP[id];

    // CLEAR ERROR WITH EXACT MISSING ID
    if (!price || !String(price).startsWith('price_')) {
      return json(400, {
        error: 'Unknown id or missing Stripe price env var',
        id,
        expected_env: `STRIPE_PRICE_${id.toUpperCase()}`,
        hint: 'Create a Stripe Price, paste the price_... into Netlify env, then redeploy.',
      });
    }

    const siteUrl = getSiteUrl(event);
    const success_url = `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${siteUrl}/pricing.html?canceled=1`;

    const mode = looksLikeSubscription(id) ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price, quantity: 1 }],
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: { tkfm_unlock_id: id },
    });

    if (!session?.url) {
      return json(500, { error: 'Stripe session created but no URL returned', id });
    }

    return json(200, { url: session.url });
  } catch (e) {
    return json(500, { error: 'Stripe session error', detail: String(e?.message || e) });
  }
}
