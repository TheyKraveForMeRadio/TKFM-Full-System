import Stripe from 'stripe';

function json(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(data)
  };
}

function getOrigin(event) {
  const h = event.headers || {};
  const proto = (h['x-forwarded-proto'] || h['X-Forwarded-Proto'] || 'https').split(',')[0].trim();
  const host = (h['x-forwarded-host'] || h['X-Forwarded-Host'] || h['host'] || h['Host'] || '').split(',')[0].trim();
  if (!host) return 'https://www.tkfmradio.com';
  return `${proto}://${host}`;
}

function safeStr(v, max = 120) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const secret = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!secret) return json(500, { ok: false, error: 'Stripe secret key not configured' });

    const stripe = new Stripe(secret);

    const body = event.body ? JSON.parse(event.body) : {};
    const planId = safeStr(body.planId || body.plan_id, 80);
    if (!planId) return json(400, { ok: false, error: 'Missing planId' });

    // Only allow boost plans through this endpoint
    if (!/^rotation_boost_(7d|30d)$/i.test(planId)) {
      return json(400, { ok: false, error: 'Invalid boost planId' });
    }

    // Resolve price by lookup_key == planId
    const out = await stripe.prices.list({ active: true, lookup_keys: [planId], limit: 1 });
    const price = out && out.data && out.data[0] ? out.data[0] : null;
    if (!price || !price.id) return json(400, { ok: false, error: 'No active Stripe price for lookup_key planId' });

    const origin = getOrigin(event);
    const successUrl = `${origin}/rotation-boost-submit.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/rotation-boost.html?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tkfm_lane: 'rotation_boost',
        planId
      }
    });

    return json(200, { ok: true, url: session.url, id: session.id });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
