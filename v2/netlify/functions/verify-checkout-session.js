import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: true, unlock_id, unlock })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
}
