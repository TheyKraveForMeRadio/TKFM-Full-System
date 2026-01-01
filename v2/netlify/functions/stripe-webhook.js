import Stripe from 'stripe';
import { supabaseEnabled, sbUpsert, sbInsert, sbPatch } from './_supabase_rest.js';

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
  analytics_pro_monthly: process.env.STRIPE_PRICE_ANALYTICS_PRO_MONTHLY,
  social_starter_monthly: process.env.STRIPE_PRICE_SOCIAL_STARTER_MONTHLY,
  ai_dj_autopilot_monthly: process.env.STRIPE_PRICE_AI_DJ_AUTOPILOT_MONTHLY,

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

  ai_feature_verse_kit: process.env.STRIPE_PRICE_AI_FEATURE_VERSE_KIT,
  ai_imaging_pack: process.env.STRIPE_PRICE_AI_IMAGING_PACK,
  ai_label_brand_pack: process.env.STRIPE_PRICE_AI_LABEL_BRAND_PACK,
  ai_launch_campaign: process.env.STRIPE_PRICE_AI_LAUNCH_CAMPAIGN,
  ai_radio_intro: process.env.STRIPE_PRICE_AI_RADIO_INTRO,
  ai_social_pack: process.env.STRIPE_PRICE_AI_SOCIAL_PACK
};

function planIdForPrice(priceId) {
  for (const [planId, pid] of Object.entries(PRICE_MAP)) {
    if (pid && pid === priceId) return planId;
  }
  return null;
}

function json(statusCode, obj) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) };
}

function sigHeader(headers) {
  return headers?.['stripe-signature'] || headers?.['Stripe-Signature'] || headers?.['STRIPE-SIGNATURE'] || '';
}

function toRawBody(event) {
  if (!event?.body) return Buffer.from('');
  if (event.isBase64Encoded) return Buffer.from(event.body, 'base64');
  return Buffer.from(event.body, 'utf8');
}

async function logEvent(event_type, customer_id, email, payload) {
  if (!supabaseEnabled()) return;
  await sbInsert('tkfm_purchase_events', {
    event_type,
    customer_id: customer_id || null,
    email: email || null,
    payload: payload || null
  });
}

async function upsertEntitlements({ customer_id, email, status, unlocks, last_event_type }) {
  if (!supabaseEnabled()) return;
  const row = {
    customer_id,
    email: email || null,
    status: status || 'unknown',
    unlocks: unlocks || [],
    last_event_type: last_event_type || null,
    updated_at: new Date().toISOString()
  };
  await sbUpsert('tkfm_entitlements', row, 'customer_id');
}

async function patchStatus(customer_id, status, last_event_type) {
  if (!supabaseEnabled()) return;
  if (!customer_id) return;
  await sbPatch(
    'tkfm_entitlements',
    `customer_id=eq.${encodeURIComponent(customer_id)}`,
    { status: status || 'unknown', last_event_type: last_event_type || null, updated_at: new Date().toISOString() }
  );
}

export async function handler(event) {
  try {
    const secret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
    if (!secret) return json(500, { ok: false, error: 'missing_STRIPE_WEBHOOK_SECRET' });

    const sig = sigHeader(event.headers || {});
    if (!sig) return json(400, { ok: false, error: 'missing_stripe_signature' });

    const raw = toRawBody(event);
    const evt = stripe.webhooks.constructEvent(raw, sig, secret);

    // Default values for logging
    let customer_id = null;
    let email = null;

    // Handle events
    if (evt.type === 'checkout.session.completed') {
      // Pull full line items to map prices -> plan ids
      const session = evt.data.object;
      customer_id = session.customer || null;
      email = session.customer_details?.email || session.customer_email || null;

      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price']
      });

      const items = full?.line_items?.data || [];
      const unlocked = [];

      for (const li of items) {
        const priceId = li?.price?.id;
        const planId = planIdForPrice(priceId);
        if (planId) unlocked.push(planId);
      }

      const uniq = Array.from(new Set(unlocked));

      await upsertEntitlements({
        customer_id,
        email,
        status: 'active',
        unlocks: uniq,
        last_event_type: evt.type
      });

      await logEvent(evt.type, customer_id, email, { session_id: session.id, unlocked: uniq });
      return json(200, { ok: true });
    }

    // Subscription lifecycle (status only)
    if (evt.type === 'invoice.payment_failed') {
      const inv = evt.data.object;
      customer_id = inv.customer || null;
      email = inv.customer_email || null;
      await patchStatus(customer_id, 'past_due', evt.type);
      await logEvent(evt.type, customer_id, email, { invoice_id: inv.id });
      return json(200, { ok: true });
    }

    if (evt.type === 'invoice.payment_succeeded') {
      const inv = evt.data.object;
      customer_id = inv.customer || null;
      email = inv.customer_email || null;
      await patchStatus(customer_id, 'active', evt.type);
      await logEvent(evt.type, customer_id, email, { invoice_id: inv.id });
      return json(200, { ok: true });
    }

    if (evt.type === 'customer.subscription.deleted') {
      const sub = evt.data.object;
      customer_id = sub.customer || null;
      await patchStatus(customer_id, 'canceled', evt.type);
      await logEvent(evt.type, customer_id, null, { subscription_id: sub.id });
      return json(200, { ok: true });
    }

    // For everything else: just acknowledge + optionally log
    await logEvent(evt.type, customer_id, email, { note: 'unhandled_event' });
    return json(200, { ok: true });
  } catch (e) {
    return json(400, { ok: false, error: 'webhook_error', message: String(e?.message || e) });
  }
}
