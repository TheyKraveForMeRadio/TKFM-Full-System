import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// data-plan id -> Stripe Price env var
const PRICE_MAP = {
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

  rotation_boost_campaign: process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN,
  homepage_feature_artist: process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST,
  homepage_takeover_day: process.env.STRIPE_PRICE_HOMEPAGE_TAKEOVER_DAY,
  radio_interview_slot: process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT,
  priority_submission_pack: process.env.STRIPE_PRICE_PRIORITY_SUBMISSION_PACK,
  press_run_pack: process.env.STRIPE_PRICE_PRESS_RUN_PACK,
  playlist_pitch_pack: process.env.STRIPE_PRICE_PLAYLIST_PITCH_PACK,

  mixtape_hosting_starter: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER,
  mixtape_hosting_pro: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO,
  mixtape_hosting_elite: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE,

  ai_feature_verse_kit: process.env.STRIPE_PRICE_AI_FEATURE_VERSE_KIT,
  ai_imaging_pack: process.env.STRIPE_PRICE_AI_IMAGING_PACK,
  ai_label_brand_pack: process.env.STRIPE_PRICE_AI_LABEL_BRAND_PACK,
  ai_launch_campaign: process.env.STRIPE_PRICE_AI_LAUNCH_CAMPAIGN,
  ai_radio_intro: process.env.STRIPE_PRICE_AI_RADIO_INTRO,
  ai_social_pack: process.env.STRIPE_PRICE_AI_SOCIAL_PACK
};

function getOrigin(event) {
  const h = event.headers || {};
  const proto = h['x-forwarded-proto'] || h['X-Forwarded-Proto'] || 'http';
  const host = h['x-forwarded-host'] || h['X-Forwarded-Host'] || h['host'] || h['Host'] || 'localhost:8888';
  return `${proto}://${host}`;
}

export async function handler(event) {
  try {
    const qs = event.queryStringParameters || {};
    const planId = String(qs.planId || '').trim();
    const quantity = Math.max(1, Number(qs.quantity || 1) || 1);

    if (!planId) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok:false, error:'missing_planId' }) };
    }

    const priceId = PRICE_MAP[planId];
    if (!priceId) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok:false, error:'unknown_planId', planId }) };
    }

    const origin = getOrigin(event);
    const price = await stripe.prices.retrieve(priceId);
    const mode = price.recurring ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity }],
      allow_promotion_codes: true,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing.html?canceled=1`,
      metadata: { tkfm_plan_id: planId }
    });

    return {
      statusCode: 303,
      headers: {
        Location: session.url,
        'cache-control': 'no-store'
      },
      body: 'redirecting'
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok:false, error:'go_checkout_failed', message:String(e?.message||e) }) };
  }
}
