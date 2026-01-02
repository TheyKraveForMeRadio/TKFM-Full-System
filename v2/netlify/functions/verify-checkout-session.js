import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

  mixtape_hosting_starter: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER,
  mixtape_hosting_pro: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO,
  mixtape_hosting_elite: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE,

  social_starter_monthly: process.env.STRIPE_PRICE_SOCIAL_STARTER_MONTHLY,
  rotation_boost_campaign: process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN,
  homepage_feature_artist: process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST,
  radio_interview_slot: process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT,

  priority_submission_pack: process.env.STRIPE_PRICE_PRIORITY_SUBMISSION_PACK,
  playlist_pitch_pack: process.env.STRIPE_PRICE_PLAYLIST_PITCH_PACK,
  press_run_pack: process.env.STRIPE_PRICE_PRESS_RUN_PACK,
  homepage_takeover_day: process.env.STRIPE_PRICE_HOMEPAGE_TAKEOVER_DAY,

  ai_dj_autopilot_monthly: process.env.STRIPE_PRICE_AI_DJ_AUTOPILOT_MONTHLY,
  analytics_pro_monthly: process.env.STRIPE_PRICE_ANALYTICS_PRO_MONTHLY,

  starter_sponsor_monthly: process.env.STRIPE_PRICE_STARTER_SPONSOR_MONTHLY,
  city_sponsor_monthly: process.env.STRIPE_PRICE_CITY_SPONSOR_MONTHLY,
  takeover_sponsor_monthly: process.env.STRIPE_PRICE_TAKEOVER_SPONSOR_MONTHLY,

  ai_radio_intro: process.env.STRIPE_PRICE_AI_RADIO_INTRO,
  feature_verse_kit: process.env.STRIPE_PRICE_FEATURE_VERSE_KIT,
  imaging_pack: process.env.STRIPE_PRICE_IMAGING_PACK,
  ai_social_pack: process.env.STRIPE_PRICE_AI_SOCIAL_PACK,
  launch_campaign: process.env.STRIPE_PRICE_LAUNCH_CAMPAIGN,
  label_brand_pack: process.env.STRIPE_PRICE_LABEL_BRAND_PACK,

  distribution_assist_monthly: process.env.STRIPE_PRICE_DISTRIBUTION_ASSIST_MONTHLY,
};

function planIdForPrice(priceId) {
  for (const [planId, pid] of Object.entries(PRICE_MAP)) {
    if (pid && pid === priceId) return planId;
  }
  return null;
}

export async function handler(event) {
  try {
    const { session_id } = event.queryStringParameters || {};
    if (!session_id) return { statusCode: 400, body: JSON.stringify({ ok:false, error:'missing_session_id' }) };

    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['line_items.data.price'] });
    const items = session?.line_items?.data || [];
    const unlocked = [];

    for (const li of items) {
      const priceId = li?.price?.id;
      const planId = planIdForPrice(priceId);
      if (planId) unlocked.push(planId);
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        session_id,
        customer: session?.customer || null,
        unlocked: Array.from(new Set(unlocked))
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error:'verify_failed', message: String(e?.message || e) }) };
  }
}
