import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function envFirst(...keys) {
  for (const k of keys) {
    const v = String(process.env[k] || '').trim();
    if (v) return v;
  }
  return '';
}

// data-plan id -> Stripe price id (from env)
const PRICE_MAP = {
  // SUBSCRIPTIONS (recurring)
  creator_pass_monthly: envFirst('STRIPE_PRICE_CREATOR_PASS_MONTHLY'),
  motion_monthly: envFirst('STRIPE_PRICE_MOTION_MONTHLY'),
  takeover_viral_monthly: envFirst('STRIPE_PRICE_TAKEOVER_VIRAL_MONTHLY'),
  dj_toolkit_monthly: envFirst('STRIPE_PRICE_DJ_TOOLKIT_MONTHLY'),
  label_core_monthly: envFirst('STRIPE_PRICE_LABEL_CORE_MONTHLY'),
  label_pro_monthly: envFirst('STRIPE_PRICE_LABEL_PRO_MONTHLY'),
  autopilot_lite_monthly: envFirst('STRIPE_PRICE_AUTOPILOT_LITE_MONTHLY'),
  autopilot_pro_monthly: envFirst('STRIPE_PRICE_AUTOPILOT_PRO_MONTHLY'),
  contract_lab_pro_monthly: envFirst('STRIPE_PRICE_CONTRACT_LAB_PRO_MONTHLY'),
  label_autopilot_monthly: envFirst('STRIPE_PRICE_LABEL_AUTOPILOT_MONTHLY'),
  sponsor_autopilot_monthly: envFirst('STRIPE_PRICE_SPONSOR_AUTOPILOT_MONTHLY'),
  submissions_priority_monthly: envFirst('STRIPE_PRICE_SUBMISSIONS_PRIORITY_MONTHLY'),
  analytics_pro_monthly: envFirst('STRIPE_PRICE_ANALYTICS_PRO_MONTHLY'),

  // AI DJ Autopilot (monthly)
  ai_dj_autopilot_monthly: envFirst('STRIPE_PRICE_AI_DJ_AUTOPILOT_MONTHLY'),

  // MIXTAPE HOSTING (one-time prices)
  mixtape_hosting_starter: envFirst('STRIPE_PRICE_MIXTAPE_HOSTING_STARTER'),
  mixtape_hosting_pro: envFirst('STRIPE_PRICE_MIXTAPE_HOSTING_PRO'),
  mixtape_hosting_elite: envFirst('STRIPE_PRICE_MIXTAPE_HOSTING_ELITE'),

  // SOCIAL / FEATURE LANES
  social_starter_monthly: envFirst('STRIPE_PRICE_SOCIAL_STARTER_MONTHLY'),
  rotation_boost_campaign: envFirst('STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN'),
  homepage_feature_artist: envFirst('STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST'),
  radio_interview_slot: envFirst('STRIPE_PRICE_RADIO_INTERVIEW_SLOT'),
  homepage_takeover_day: envFirst('STRIPE_PRICE_HOMEPAGE_TAKEOVER_DAY'),

  // THE 6 YOU SAID ARE STILL BROKEN (match your env names)
  city_sponsor_monthly: envFirst('STRIPE_PRICE_SPONSOR_CITY_MONTHLY','STRIPE_PRICE_CITY_SPONSOR_MONTHLY'),
  takeover_sponsor_monthly: envFirst('STRIPE_PRICE_SPONSOR_TAKEOVER_MONTHLY','STRIPE_PRICE_TAKEOVER_SPONSOR_MONTHLY'),

  feature_verse_kit: envFirst('STRIPE_PRICE_AI_FEATURE_VERSE_KIT','STRIPE_PRICE_FEATURE_VERSE_KIT'),
  imaging_pack: envFirst('STRIPE_PRICE_AI_IMAGING_PACK','STRIPE_PRICE_IMAGING_PACK'),
  launch_campaign: envFirst('STRIPE_PRICE_AI_LAUNCH_CAMPAIGN','STRIPE_PRICE_LAUNCH_CAMPAIGN'),
  label_brand_pack: envFirst('STRIPE_PRICE_AI_LABEL_BRAND_PACK','STRIPE_PRICE_LABEL_BRAND_PACK'),

  // OTHER one-time packs you already have
  priority_submission_pack: envFirst('STRIPE_PRICE_PRIORITY_SUBMISSION_PACK'),
  playlist_pitch_pack: envFirst('STRIPE_PRICE_PLAYLIST_PITCH_PACK'),
  press_run_pack: envFirst('STRIPE_PRICE_PRESS_RUN_PACK'),
  ai_radio_intro: envFirst('STRIPE_PRICE_AI_RADIO_INTRO'),
  ai_social_pack: envFirst('STRIPE_PRICE_AI_SOCIAL_PACK'),
  distribution_assist_monthly: envFirst('STRIPE_PRICE_DISTRIBUTION_ASSIST_MONTHLY'),
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

    if (!planId) return { statusCode: 400, body: JSON.stringify({ ok:false, error:'missing_planId' }) };

    if (!(planId in PRICE_MAP)) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error:'unknown_planId', planId }) };
    }

    const priceId = String(PRICE_MAP[planId] || '').trim();
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error:'missing_price_env', planId }) };
    }

    const baseUrl = inferBaseUrl(event);
    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      return { statusCode: 500, body: JSON.stringify({ ok:false, error:'bad_base_url' }) };
    }

    const price = await stripe.prices.retrieve(priceId);
    const mode = price.recurring ? 'subscription' : 'payment';

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
      body: JSON.stringify({ ok:true, mode, planId, url: session.url, session_id: session.id })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error:'create_session_failed', message:String(e?.message || e) }) };
  }
}
