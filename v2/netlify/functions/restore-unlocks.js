import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  radio_interview_slot: process.env.STRIPE_PRICE_RADIO_INTERVIEW_SLOT
};

function planIdForPrice(priceId) {
  for (const [planId, pid] of Object.entries(PRICE_MAP)) {
    if (pid && pid === priceId) return planId;
  }
  return null;
}

function normEmail(v) {
  return String(v || '').trim().toLowerCase();
}

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function escapeSearch(v) {
  // Stripe search uses single quotes; escape single quotes
  return String(v || '').replace(/'/g, "\\'");
}

async function findCustomersByEmail(email) {
  // Prefer Search API
  try {
    const res = await stripe.customers.search({ query: `email:'${escapeSearch(email)}'`, limit: 10 });
    return res.data || [];
  } catch (_) {
    // Fallback: list and filter (best-effort)
    const res = await stripe.customers.list({ limit: 100 });
    return (res.data || []).filter(c => normEmail(c.email) === email);
  }
}

async function sessionUnlocks(sessionId) {
  const full = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items.data.price'] });
  const items = full?.line_items?.data || [];
  const unlocked = [];
  for (const li of items) {
    const priceId = li?.price?.id;
    const planId = planIdForPrice(priceId);
    if (planId) unlocked.push(planId);
  }
  return {
    id: full.id,
    created: full.created,
    mode: full.mode,
    status: full.status,
    payment_status: full.payment_status,
    unlocked: uniq(unlocked)
  };
}

export async function handler(event) {
  try {
    const email = normEmail(event.queryStringParameters?.email || '');
    if (!email) {
      return { statusCode: 400, headers: { 'content-type':'application/json' }, body: JSON.stringify({ ok:false, error:'missing_email' }) };
    }

    const customers = await findCustomersByEmail(email);
    if (!customers.length) {
      return { statusCode: 200, headers: { 'content-type':'application/json' }, body: JSON.stringify({ ok:true, email, customers_found: 0, unlocked: [] }) };
    }

    const sessionsChecked = [];
    let unlockedAll = [];

    for (const c of customers) {
      // List checkout sessions for this customer (most recent first)
      const list = await stripe.checkout.sessions.list({ customer: c.id, limit: 50 });
      const sessions = list.data || [];

      // Only completed/paid sessions
      const completed = sessions.filter(s => (s.status === 'complete') || (s.payment_status === 'paid'));

      // Retrieve line_items for each completed session (limited)
      for (const s of completed.slice(0, 25)) {
        const info = await sessionUnlocks(s.id);
        sessionsChecked.push(info);
        unlockedAll = unlockedAll.concat(info.unlocked || []);
      }
    }

    const unlocked = uniq(unlockedAll);

    return {
      statusCode: 200,
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({
        ok: true,
        email,
        customers_found: customers.length,
        unlocked,
        sessions_checked: sessionsChecked.slice(0, 20)
      })
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'content-type':'application/json' }, body: JSON.stringify({ ok:false, error:'restore_failed', message:String(e?.message || e) }) };
  }
}
