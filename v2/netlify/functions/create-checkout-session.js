import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// planId -> Stripe Price env var
const PRICE_MAP = {
  // SUBSCRIPTIONS (monthly)
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
  distribution_assist_monthly: process.env.STRIPE_PRICE_DISTRIBUTION_ASSIST_MONTHLY,

  social_starter_monthly: process.env.STRIPE_PRICE_SOCIAL_STARTER_MONTHLY,

  // SPONSORS (monthly) – support BOTH naming styles
  starter_sponsor_monthly: process.env.STRIPE_PRICE_STARTER_SPONSOR_MONTHLY,
  sponsor_city_monthly: process.env.STRIPE_PRICE_SPONSOR_CITY_MONTHLY || process.env.STRIPE_PRICE_CITY_SPONSOR_MONTHLY,
  sponsor_takeover_monthly: process.env.STRIPE_PRICE_SPONSOR_TAKEOVER_MONTHLY || process.env.STRIPE_PRICE_TAKEOVER_SPONSOR_MONTHLY,

  // ONE-TIME PACKS
  priority_submission_pack: process.env.STRIPE_PRICE_PRIORITY_SUBMISSION_PACK,
  playlist_pitch_pack: process.env.STRIPE_PRICE_PLAYLIST_PITCH_PACK,
  press_run_pack: process.env.STRIPE_PRICE_PRESS_RUN_PACK,

  homepage_takeover_day: process.env.STRIPE_PRICE_HOMEPAGE_TAKEOVER_DAY,
  homepage_feature_artist: process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST,

  rotation_boost_campaign: process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN,
  radio_interview_slot: process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT,

  // MIXTAPE HOSTING (you moved these to one-time)
  mixtape_hosting_starter: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER,
  mixtape_hosting_pro: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO,
  mixtape_hosting_elite: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE,

  // AI ONE-TIME PACKS (support BOTH ai_* planIds AND non-ai names)
  ai_radio_intro: process.env.STRIPE_PRICE_AI_RADIO_INTRO,
  ai_social_pack: process.env.STRIPE_PRICE_AI_SOCIAL_PACK,
  ai_feature_verse_kit: process.env.STRIPE_PRICE_AI_FEATURE_VERSE_KIT || process.env.STRIPE_PRICE_FEATURE_VERSE_KIT,
  ai_imaging_pack: process.env.STRIPE_PRICE_AI_IMAGING_PACK || process.env.STRIPE_PRICE_IMAGING_PACK,
  ai_launch_campaign: process.env.STRIPE_PRICE_AI_LAUNCH_CAMPAIGN || process.env.STRIPE_PRICE_LAUNCH_CAMPAIGN,
  ai_label_brand_pack: process.env.STRIPE_PRICE_AI_LABEL_BRAND_PACK || process.env.STRIPE_PRICE_LABEL_BRAND_PACK,

  // AI SUBSCRIPTION
  ai_dj_autopilot_monthly: process.env.STRIPE_PRICE_AI_DJ_AUTOPILOT_MONTHLY,

  // OWNER
  owner_founder_access: process.env.STRIPE_PRICE_OWNER_FOUNDER_ACCESS,
};

function requirePrice(planId) {
  const priceId = PRICE_MAP[planId];
  if (!priceId) {
    return { ok: false, error: PRICE_MAP.hasOwnProperty(planId) ? 'missing_price_env' : 'unknown_planId' };
  }
  if (!String(priceId).startsWith('price_')) {
    return { ok: false, error: 'bad_price_env', value: String(priceId) };
  }
  return { ok: true, priceId: String(priceId) };
}

function modeForPrice(priceObj) {
  // recurring => subscription, else => payment
  return priceObj && priceObj.type === 'recurring' ? 'subscription' : 'payment';
}

export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const planId = body.planId || body.id || body.featureId;
    const quantity = Number(body.quantity || 1);

    if (!planId) return { statusCode: 400, body: JSON.stringify({ ok:false, error:'missing_planId' }) };

    const req = requirePrice(planId);
    if (!req.ok) return { statusCode: 400, body: JSON.stringify({ ok:false, planId, error:req.error, value:req.value || null }) };

    // Fetch price to determine subscription vs one-time
    const price = await stripe.prices.retrieve(req.priceId);

    const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || process.env.SITE_URL || 'http://localhost:8888';
    const success_url = `${origin.replace(/\/$/,'')}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url  = `${origin.replace(/\/$/,'')}/pricing.html?canceled=1`;

    const mode = modeForPrice(price);

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: req.priceId, quantity: isFinite(quantity) && quantity > 0 ? quantity : 1 }],
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok:true, mode, planId, url: session.url, session_id: session.id })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error:'create_session_failed', message: String(e?.message || e) }) };
  }
}
