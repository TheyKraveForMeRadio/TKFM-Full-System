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

  // ONE-TIME / SERVICE (if you configured them as one-time prices)
  rotation_boost_campaign: process.env.STRIPE_PRICE_ROTATION_BOOST_CAMPAIGN,
  homepage_feature_artist: process.env.STRIPE_PRICE_HOMEPAGE_FEATURE_ARTIST,
  homepage_takeover_day: process.env.STRIPE_PRICE_HOMEPAGE_TAKEOVER_DAY,
  radio_interview_slot: process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT,
  priority_submission_pack: process.env.STRIPE_PRICE_PRIORITY_SUBMISSION_PACK,
  press_run_pack: process.env.STRIPE_PRICE_PRESS_RUN_PACK,
  playlist_pitch_pack: process.env.STRIPE_PRICE_PLAYLIST_PITCH_PACK,

  // MIXTAPE HOSTING (yours is currently recurring monthly in Stripe)
  mixtape_hosting_starter: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER,
  mixtape_hosting_pro: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_PRO,
  mixtape_hosting_elite: process.env.STRIPE_PRICE_MIXTAPE_HOSTING_ELITE,

  // AI STORE (often one-time, depending how you set Stripe)
  ai_feature_verse_kit: process.env.STRIPE_PRICE_AI_FEATURE_VERSE_KIT,
  ai_imaging_pack: process.env.STRIPE_PRICE_AI_IMAGING_PACK,
  ai_label_brand_pack: process.env.STRIPE_PRICE_AI_LABEL_BRAND_PACK,
  ai_launch_campaign: process.env.STRIPE_PRICE_AI_LAUNCH_CAMPAIGN,
  ai_radio_intro: process.env.STRIPE_PRICE_AI_RADIO_INTRO,
  ai_social_pack: process.env.STRIPE_PRICE_AI_SOCIAL_PACK
};

function json(statusCode, obj) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) };
}

function getOrigin(event) {
  const h = event.headers || {};
  const proto = h['x-forwarded-proto'] || h['X-Forwarded-Proto'] || 'http';
  const host = h['x-forwarded-host'] || h['X-Forwarded-Host'] || h['host'] || h['Host'] || 'localhost:8888';
  return `${proto}://${host}`;
}

function parseBody(event) {
  try {
    if (!event.body) return {};
    return JSON.parse(event.body);
  } catch (_) {
    return {};
  }
}

// supports either: { planId, quantity } OR { items:[{planId,quantity}] }
function normalizeItems(body) {
  if (Array.isArray(body.items) && body.items.length) {
    return body.items.map(it => ({
      planId: String(it.planId || it.id || '').trim(),
      quantity: Number(it.quantity || 1) || 1
    })).filter(it => it.planId);
  }
  const planId = String(body.planId || body.id || '').trim();
  const quantity = Number(body.quantity || 1) || 1;
  return planId ? [{ planId, quantity }] : [];
}

export async function handler(event) {
  try {
    const body = parseBody(event);
    const origin = getOrigin(event);

    const items = normalizeItems(body);
    if (!items.length) return json(400, { ok: false, error: 'missing_planId' });

    // This implementation supports ONE item at a time (clean + avoids mixed mode issues)
    const { planId, quantity } = items[0];

    const priceId = PRICE_MAP[planId];
    if (!priceId) return json(400, { ok: false, error: 'unknown_planId', planId });

    // Retrieve the Stripe Price to detect recurring vs one-time
    const price = await stripe.prices.retrieve(priceId);

    const isRecurring = !!price.recurring;
    const mode = isRecurring ? 'subscription' : 'payment';

    // Guard: do not allow mixed recurring/one-time in one session (future-proof)
    if (items.length > 1) {
      return json(400, {
        ok: false,
        error: 'multi_item_not_supported',
        message: 'Use one planId at a time to avoid mixed recurring/payment checkout.'
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity }],
      allow_promotion_codes: true,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing.html?canceled=1`,
      // Optional: pass metadata for your audit trail
      metadata: {
        tkfm_plan_id: planId
      }
    });

    return json(200, { ok: true, mode, planId, url: session.url, session_id: session.id });
  } catch (e) {
    return json(500, { ok: false, error: 'create_session_failed', message: String(e?.message || e) });
  }
}
