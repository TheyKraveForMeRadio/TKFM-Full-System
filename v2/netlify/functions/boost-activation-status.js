import Stripe from 'stripe';
import { getStore } from './_helpers.js';

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

function safeStr(v, max = 200) {
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
    const sessionId = safeStr(body.session_id || body.sessionId, 200);
    if (!sessionId) return json(400, { ok: false, error: 'Missing session_id' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || !session.id) return json(404, { ok: false, error: 'Session not found' });

    const paid = session.payment_status === 'paid';
    const lane = (session.metadata && session.metadata.tkfm_lane) ? String(session.metadata.tkfm_lane) : '';
    const planId = (session.metadata && session.metadata.planId) ? String(session.metadata.planId) : '';

    if (!paid) return json(200, { ok: true, paid: false, activated: false, lane, planId });

    const fmKey = 'featured_media';
    const list = (await getStore(fmKey)) || [];
    const items = Array.isArray(list) ? list : [];

    const hit = items.find(x => String(x.stripeSessionId || '') === String(sessionId));
    if (!hit) return json(200, { ok: true, paid: true, activated: false, lane, planId });

    return json(200, { ok: true, paid: true, activated: true, lane, planId, id: hit.id, boostUntil: hit.boostUntil });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
