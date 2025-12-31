import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseUpsertUnlock({ session_id, customer_email, unlock_id, unlock }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  const url = `${SUPABASE_URL}/rest/v1/tkfm_unlocks`;
  const payload = [{
    session_id,
    customer_email: customer_email || null,
    unlock_id: unlock_id || null,
    unlock: unlock || {}
  }];

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(payload)
  });
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const body = JSON.parse(event.body || '{}');
    const session_id = body.session_id || body.sessionId;
    if (!session_id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing session_id' }) };

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const ok =
      session?.status === 'complete' ||
      session?.payment_status === 'paid';

    if (!ok) {
      return { statusCode: 402, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paid: false }) };
    }

    const unlock_id = session?.metadata?.unlock_id || null;

    let unlock = {};
    try { unlock = JSON.parse(session?.metadata?.unlock_json || '{}'); } catch { unlock = {}; }

    const customer_email =
      session?.customer_details?.email ||
      session?.customer_email ||
      null;

    await supabaseUpsertUnlock({ session_id, customer_email, unlock_id, unlock });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: true, unlock_id, unlock, customer_email })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
}
