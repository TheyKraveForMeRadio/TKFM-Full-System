import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function siteUrl() {
  return (process.env.SITE_URL || 'http://localhost:8888').replace(/\/+$/,'');
}

function pickFirst(...vals) {
  for (const v of vals) {
    const s = String(v || '').trim();
    if (s && !s.toLowerCase().includes('no value set')) return s;
  }
  return '';
}

// pricing.html planId -> Stripe price id (env var)
const PRICE_MAP = {
  // --- SUBSCRIPTIONS (monthly access) ---
  creator_pass_monthly: pickFirst(process.env.STRIPE_PRICE_CREATOR_PASS_MONTHLY),
  motion_monthly: pickFirst(process.env.STRIPE_PRICE_MOTION_MONTHLY),
  takeover_viral_monthly: pickFirst(process.env.STRIPE_PRICE_TAKEOVER_VIRAL_MONTHLY),
  dj_toolkit_monthly: pickFirst(process.env.STRIPE_PRICE_DJ_TOOLKIT_MONTHLY),

  analytics_pro_monthly: pickFirst(process.env.STRIPE_PRICE_ANALYTICS_PRO_MONTHLY),
  distribution_assist_monthly: pickFirst(process.env.STRIPE_PRICE_DISTRIBUTION_ASSIST_MONTHLY),

  autopilot_lite_monthly: pickFirst(process.env.STRIPE_PRICE_AUTOPILOT_LITE_MONTHLY),
  autopilot_pro_monthly: pickFirst(process.env.STRIPE_PRICE_AUTOPILOT_PRO_MONTHLY),
  contract_lab_pro_monthly: pickFirst(process.env.STRIPE_PRICE_CONTRACT_LAB_PRO_MONTHLY),

  label_core_monthly: pickFirst(process.env.STRIPE_PRICE_LABEL_CORE_MONTHLY),
  label_pro_monthly: pickFirst(process.env.STRIPE_PRICE_LABEL_PRO_MONTHLY),
  label_autopilot_monthly: pickFirst(process.env.STRIPE_PRICE_LABEL_AUTOPILOT_MONTHLY),

  sponsor_autopilot_monthly: pickFirst(process.env.STRIPE_PRICE_SPONSOR_AUTOPILOT_MONTHLY),
  submissions_priority_monthly: pickFirst(process.env.STRIPE_PRICE_SUBMISSIONS_PRIORITY_MONTHLY),

  social_starter_monthly: pickFirst(process.env.STRIPE_PRICE_SOCIAL_STARTER_MONTHLY),

  // Sponsor tiers (pricing.html)
  starter_sponsor_monthly: pickFirst(
    process.env.STRIPE_PRICE_STARTER_SPONSOR_MONTHLY
  ),
  sponsor_city_monthly: pickFirst(
    process.env.STRIPE_PRICE_SPONSOR_CITY_MONTHLY,
    process.env.STRIPE_PRICE_CITY_SPONSOR_MONTHLY
  ),
  sponsor_takeover_monthly: pickFirst(
    process.env.STRIPE_PRICE_SPONSOR_TAKEOVER_MONTHLY,
    process.env.STRIPE_PRICE_TAKEOVER_SPONSOR_MONTHLY
  ),

  // --- ONE-TIME PRODUCTS ---
  priority_submission_pack: pickFirst(process.env.STRIPE_PRICE_PRIORITY_SUBMISSION_PACK),
  playlist_pitch_pack: pickFirst(process.env.STRIPE_PRICE_PLAYLIST_PITCH_PACK),
  press_run_pack: pickFirst(process.env.STRIPE_PRICE_PRESS_RUN_PACK),

  homepage_takeover_day: pickFirst(process.env.STRIPE_PRICE_HOMEPAGE_TAKEOVER_DAY),
  homepage_feature_artist: pickFirst(process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST),

  rotation_boost_campaign: pickFirst(process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN),
  radio_interview_slot: pickFirst(process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT),

  mixtape_hosting_starter: pickFirst(process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER),
  mixtape_hosting_pro: pickFirst(process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO),
  mixtape_hosting_elite: pickFirst(process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE),

  // AI packs (pricing.html planIds)
  ai_dj_autopilot_monthly: pickFirst(process.env.STRIPE_PRICE_AI_DJ_AUTOPILOT_MONTHLY),
  ai_radio_intro: pickFirst(process.env.STRIPE_PRICE_AI_RADIO_INTRO),
  ai_social_pack: pickFirst(process.env.STRIPE_PRICE_AI_SOCIAL_PACK),

  ai_feature_verse_kit: pickFirst(
    process.env.STRIPE_PRICE_AI_FEATURE_VERSE_KIT,
    process.env.STRIPE_PRICE_FEATURE_VERSE_KIT
  ),
  ai_imaging_pack: pickFirst(
    process.env.STRIPE_PRICE_AI_IMAGING_PACK,
    process.env.STRIPE_PRICE_IMAGING_PACK
  ),
  ai_launch_campaign: pickFirst(
    process.env.STRIPE_PRICE_AI_LAUNCH_CAMPAIGN,
    process.env.STRIPE_PRICE_LAUNCH_CAMPAIGN
  ),
  ai_label_brand_pack: pickFirst(
    process.env.STRIPE_PRICE_AI_LABEL_BRAND_PACK,
    process.env.STRIPE_PRICE_LABEL_BRAND_PACK
  ),

  // Owner
  owner_founder_access: pickFirst(process.env.STRIPE_PRICE_OWNER_FOUNDER_ACCESS)
};

function missingEnvFor(planId) {
  // Return a helpful list of env keys that could satisfy this planId
  const hints = {
    sponsor_city_monthly: ['STRIPE_PRICE_SPONSOR_CITY_MONTHLY', 'STRIPE_PRICE_CITY_SPONSOR_MONTHLY'],
    sponsor_takeover_monthly: ['STRIPE_PRICE_SPONSOR_TAKEOVER_MONTHLY', 'STRIPE_PRICE_TAKEOVER_SPONSOR_MONTHLY'],
    ai_feature_verse_kit: ['STRIPE_PRICE_AI_FEATURE_VERSE_KIT', 'STRIPE_PRICE_FEATURE_VERSE_KIT'],
    ai_imaging_pack: ['STRIPE_PRICE_AI_IMAGING_PACK', 'STRIPE_PRICE_IMAGING_PACK'],
    ai_launch_campaign: ['STRIPE_PRICE_AI_LAUNCH_CAMPAIGN', 'STRIPE_PRICE_LAUNCH_CAMPAIGN'],
    ai_label_brand_pack: ['STRIPE_PRICE_AI_LABEL_BRAND_PACK', 'STRIPE_PRICE_LABEL_BRAND_PACK']
  };
  return hints[planId] || [];
}

export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const planId = String(body.planId || body.plan || body.feature || '').trim();
    const quantity = Math.max(1, Number(body.quantity || 1));

    if (!planId) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error:'missing_planId' }) };
    }

    if (!(planId in PRICE_MAP)) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error:'unknown_planId', planId }) };
    }

    const priceId = String(PRICE_MAP[planId] || '').trim();
    if (!priceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok:false,
          error:'missing_price_env',
          planId,
          expected_env: missingEnvFor(planId)
        })
      };
    }

    // Detect mode by retrieving the price object (recurring => subscription; else payment)
    const price = await stripe.prices.retrieve(priceId);
    const mode = price && price.recurring ? 'subscription' : 'payment';

    const base = siteUrl();
    const successUrl = `${base}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${base}/pricing.html?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true
    });

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        mode,
        planId,
        session_id: session.id,
        url: session.url
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok:false, error:'create_session_failed', message: String(e?.message || e) })
    };
  }
}
