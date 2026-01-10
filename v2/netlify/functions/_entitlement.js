import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function normalizeKey(id) {
  return String(id || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function envPriceIdForPlan(planId) {
  const k = 'STRIPE_PRICE_' + normalizeKey(planId);
  return { envKey: k, priceId: (process.env[k] || '').trim() };
}

async function activeSubscriptionsForEmail(email) {
  const customers = await stripe.customers.list({ email, limit: 10 });
  if (!customers.data.length) return [];

  const subsAll = [];
  for (const c of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: c.id, status: 'all', limit: 50 });
    for (const s of subs.data) subsAll.push(s);
  }

  // Active/trialing only
  return subsAll.filter(s => s.status === 'active' || s.status === 'trialing');
}

function subscriptionHasPlanIdMeta(sub) {
  const pid = sub?.metadata?.planId;
  return pid ? String(pid).trim() : '';
}

function subscriptionHasPriceId(sub, priceId) {
  if (!priceId) return false;
  const items = sub?.items?.data || [];
  return items.some(it => it?.price?.id === priceId);
}

// Server-verified entitlement check.
// Works if you set subscription_data.metadata.planId during checkout (preferred),
// AND also works without metadata by matching subscription item price ids to STRIPE_PRICE_* env vars.
export async function requireActivePlansByEmail(email, requiredPlanIds) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const required = (requiredPlanIds || []).filter(Boolean);

  if (!cleanEmail) return { ok: false, error: 'Missing email' };
  if (!required.length) return { ok: true, activePlanIds: [] };

  const subs = await activeSubscriptionsForEmail(cleanEmail);

  const activePlanIds = new Set();

  // Collect planIds from metadata
  for (const s of subs) {
    const pid = subscriptionHasPlanIdMeta(s);
    if (pid) activePlanIds.add(pid);
  }

  // Also match price ids back to planIds via env vars
  for (const pid of required) {
    const { envKey, priceId } = envPriceIdForPlan(pid);
    if (!priceId) continue;
    const match = subs.some(s => subscriptionHasPriceId(s, priceId));
    if (match) activePlanIds.add(pid);
  }

  const hasAny = required.some(pid => activePlanIds.has(pid));

  return {
    ok: true,
    email: cleanEmail,
    requiredPlanIds: required,
    activePlanIds: Array.from(activePlanIds),
    hasAny,
  };
}
