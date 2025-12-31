import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const session_id = String(body.session_id || '').trim();
    if (!session_id) return json(400, { error: 'Missing session_id' });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const paid =
      session?.payment_status === 'paid' ||
      session?.status === 'complete';

    const unlock_id =
      session?.metadata?.tkfm_unlock_id ||
      session?.metadata?.tkfm_unlock ||
      null;

    return json(200, {
      paid,
      unlock_id,
      customer_email: session?.customer_details?.email || session?.customer_email || null,
      customer_id: session?.customer || null,
      mode: session?.mode || null,
    });
  } catch (e) {
    return json(500, { error: 'Verify session error', detail: String(e?.message || e) });
  }
}
