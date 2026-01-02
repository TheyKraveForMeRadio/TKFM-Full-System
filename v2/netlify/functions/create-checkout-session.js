import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// data-plan id -> Stripe price id env var
const PRICE_MAP = {
  // SUBSCRIPTIONS (recurring)
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

  // MIXTAPE HOSTING (one-time)
  mixtape_hosting_starter: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER,
  mixtape_hosting_pro: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO,
  mixtape_hosting_elite: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE,

  // SOCIAL / FEATURE LANES (existing)
  social_starter_monthly: process.env.STRIPE_PRICE_SOCIAL_STARTER_MONTHLY,
  rotation_boost_campaign: process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN,
  homepage_feature_artist: process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST,
  radio_interview_slot: process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT,

  // --- NEW: THE ONES YOU LISTED (add these env vars to .env / Netlify) ---
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

function cleanUrl(u) {
  return String(u || '').trim().replace(/\/+$/, '');
}

function inferBaseUrl(event) {
  const envSite = cleanUrl(process.env.SITE_URL);
  const isDev = String(process.env.NETLIFY_DEV || '').toLowerCase() === 'true';

  const hdrs = event.headers || {};
  const origin = cleanUrl(hdrs.origin || hdrs.Origin);

  if (isDev && origin && /^https?:\/\//i.test(origin)) return origin;
  if (envSite && /^https?:\/\//i.test(envSite)) return envSite;

  const proto = cleanUrl(hdrs['x-forwarded-proto'] || hdrs['X-Forwarded-Proto'] || 'https');
  const host = cleanUrl(hdrs.host || hdrs.Host);
  if (host) return `${proto}://${host}`;

  return '';
}

export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const planId = String(body.planId || '').trim();
    const quantity = Math.max(1, Number(body.quantity || 1));

    if (!planId) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'missing_planId' }) };
    }

    if (!(planId in PRICE_MAP)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'unknown_planId', planId }) };
    }

    const priceId = String(PRICE_MAP[planId] || '').trim();
    if (!priceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          error: 'missing_price_env',
          planId,
          message: 'Plan exists but its STRIPE_PRICE_... env var is missing/blank.'
        })
      };
    }

    const baseUrl = inferBaseUrl(event);
    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'bad_base_url' }) };
    }

    // Correct mode based on Stripe Price object
    const price = await stripe.prices.retrieve(priceId);
    const isRecurring = !!price.recurring;
    const mode = isRecurring ? 'subscription' : 'payment';

    const success_url = `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${baseUrl}/pricing.html?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode,
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity }],
      success_url,
      cancel_url,
      metadata: { planId }
    });

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        mode,
        planId,
        url: session.url,
        session_id: session.id,
        base_url: baseUrl
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'create_session_failed', message: String(e?.message || e) }) };
  }
}
