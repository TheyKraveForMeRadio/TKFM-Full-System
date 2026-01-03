import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  const qs = event.queryStringParameters || {};
  const email = String(qs.email || '').trim().toLowerCase();
  if (!email) return json(400, { ok: false, error: 'Missing email' });

  try {
    // Find customer(s) by email
    const customers = await stripe.customers.list({ email, limit: 10 });
    if (!customers.data.length) return json(200, { ok: true, email, activePlanIds: [] });

    // Collect active planIds from subscription metadata
    const activePlanIds = new Set();

    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: 'all', limit: 50 });
      for (const s of subs.data) {
        const st = String(s.status || '');
        const active = (st === 'active' || st === 'trialing');
        if (!active) continue;

        const pid = s.metadata?.planId;
        if (pid) activePlanIds.add(pid);
      }
    }

    return json(200, { ok: true, email, activePlanIds: Array.from(activePlanIds) });
  } catch (e) {
    return json(200, { ok: false, error: e?.message || 'Stripe error' });
  }
}
