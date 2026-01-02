import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// data-plan id -> Stripe price id (from env)
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

  // MIXTAPE HOSTING (ONE-TIME)
  mixtape_hosting_starter: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER,
  mixtape_hosting_pro: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO,
  mixtape_hosting_elite: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE,

  // SOCIAL / FEATURE LANES
  social_starter_monthly: process.env.STRIPE_PRICE_SOCIAL_STARTER_MONTHLY,
  rotation_boost_campaign: process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN,
  homepage_feature_artist: process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST,
  radio_interview_slot: process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT,
};

function cleanUrl(u) {
  return String(u || '').trim().replace(/\/+$/, '');
}

function inferBaseUrl(event) {
  // Prefer explicit env in production.
  const envSite = cleanUrl(process.env.SITE_URL);
  const isDev = String(process.env.NETLIFY_DEV || '').toLowerCase() === 'true';

  // In dev: always prefer request Origin so localhost never breaks.
  const hdrs = event.headers || {};
  const origin = cleanUrl(hdrs.origin || hdrs.Origin);
  if (isDev && origin && /^https?:\/\//i.test(origin)) return origin;

  // In prod: use SITE_URL if valid.
  if (envSite && /^https?:\/\//i.test(envSite)) return envSite;

  // Fallback: infer from host + proto.
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

    const priceId = PRICE_MAP[planId];
    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'unknown_planId', planId }) };
    }

    const baseUrl = inferBaseUrl(event);
    if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: 'bad_base_url',
          message: 'Could not infer base URL. Set SITE_URL or ensure request has Origin/Host headers.'
        })
      };
    }

    // Pull the Price from Stripe so mode is always correct
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
      metadata: { planId },
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
      }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'create_session_failed', message: String(e?.message || e) }) };
  }
}
