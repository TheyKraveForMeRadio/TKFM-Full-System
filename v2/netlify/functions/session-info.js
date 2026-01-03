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
  const session_id = String(qs.session_id || qs.id || '').trim();
  if (!session_id) return json(400, { ok: false, error: 'Missing session_id' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const planId = session?.metadata?.planId || session?.client_reference_id || null;
    const mode = session?.mode || null;

    let subscription = null;
    if (mode === 'subscription' && session?.subscription) {
      subscription = await stripe.subscriptions.retrieve(session.subscription);
    }

    const email = session?.customer_details?.email || session?.customer_email || null;

    return json(200, {
      ok: true,
      session_id,
      planId,
      mode,
      email,
      payment_status: session?.payment_status || null,
      subscription_status: subscription?.status || null,
      subscription_id: subscription?.id || null,
    });
  } catch (e) {
    return json(200, { ok: false, error: e?.message || 'Stripe error' });
  }
}
