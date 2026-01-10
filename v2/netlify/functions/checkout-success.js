import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  const qs = event.queryStringParameters || {};
  const session_id = String(qs.session_id || '').trim();
  if (!session_id) return json(400, { ok: false, error: 'Missing session_id' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription'] });

    // Accept paid one-time, or subscription that exists
    const mode = session.mode;
    const paid = session.payment_status === 'paid';
    const hasSub = !!session.subscription;
    const ok = (mode === 'payment' && paid) || (mode === 'subscription' && hasSub);

    if (!ok) {
      return json(402, { ok: false, error: 'Payment not complete', mode, payment_status: session.payment_status });
    }

    const feature_id = (session.metadata && session.metadata.feature_id) || null;
    return json(200, {
      ok: true,
      feature_id,
      mode,
      customer_email: (session.customer_details && session.customer_details.email) || null,
    });
  } catch (e) {
    return json(500, { ok: false, error: e?.message || 'Stripe error' });
  }
}
