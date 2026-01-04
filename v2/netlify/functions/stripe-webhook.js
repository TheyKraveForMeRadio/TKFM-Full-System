import Stripe from 'stripe';
import { getStore, setStore } from './_helpers.js';

// TKFM Stripe Webhook:
// - handles checkout.session.completed for rotation_boost
// - uses metadata.boostToken to fetch pending payload
// Env required:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET

function rawBody(event) {
  // Netlify provides raw body in event.body (string). If isBase64Encoded, decode.
  if (!event.body) return '';
  if (event.isBase64Encoded) {
    return Buffer.from(event.body, 'base64').toString('utf8');
  }
  return event.body;
}

function json(statusCode, data) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(data)
  };
}

function makeId() {
  return 'fm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

function daysForPlan(planId) {
  if (planId === 'rotation_boost_7d') return 7;
  if (planId === 'rotation_boost_30d') return 30;
  return 0;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

    const secret = (process.env.STRIPE_SECRET_KEY || '').trim();
    const whsec = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
    if (!secret) return { statusCode: 500, body: 'Missing STRIPE_SECRET_KEY' };
    if (!whsec) return { statusCode: 500, body: 'Missing STRIPE_WEBHOOK_SECRET' };

    const stripe = new Stripe(secret);

    const sig =
      (event.headers && (event.headers['stripe-signature'] || event.headers['Stripe-Signature'])) || '';

    const payload = rawBody(event);

    let ev;
    try {
      ev = stripe.webhooks.constructEvent(payload, sig, whsec);
    } catch (err) {
      return { statusCode: 400, body: 'Invalid signature' };
    }

    if (ev.type !== 'checkout.session.completed') {
      return { statusCode: 200, body: 'ignored' };
    }

    const session = ev.data && ev.data.object ? ev.data.object : null;
    if (!session || !session.id) return { statusCode: 200, body: 'no session' };

    const lane = session.metadata && session.metadata.tkfm_lane ? String(session.metadata.tkfm_lane) : '';
    if (lane !== 'rotation_boost') return { statusCode: 200, body: 'not rotation_boost' };

    const planId = session.metadata && session.metadata.planId ? String(session.metadata.planId) : '';
    const token = session.metadata && session.metadata.boostToken ? String(session.metadata.boostToken) : '';

    const days = daysForPlan(planId);
    if (!days || !token) return { statusCode: 200, body: 'missing plan/token' };

    // Load pending payload
    const pendingKey = 'boost_pending';
    const pendingList = (await getStore(pendingKey)) || [];
    const pend = Array.isArray(pendingList) ? pendingList : [];
    const idx = pend.findIndex(x => String(x.token || '') === token);

    if (idx === -1) {
      // Already fulfilled or expired; still OK
      return { statusCode: 200, body: 'pending not found' };
    }

    const pending = pend[idx];

    // Write to featured_media (idempotent by session id)
    const fmKey = 'featured_media';
    const list = (await getStore(fmKey)) || [];
    const items = Array.isArray(list) ? list : [];

    if (!items.some(x => String(x.stripeSessionId || '') === String(session.id))) {
      const now = Date.now();
      const boostUntilMs = now + (days * 24 * 60 * 60 * 1000);

      const record = {
        id: makeId(),
        title: String(pending.title || 'Rotation Boost'),
        url: String(pending.url || ''),
        kind: 'link',
        addedAt: new Date(now).toISOString(),
        boostUntil: new Date(boostUntilMs).toISOString(),
        boostedAt: new Date(now).toISOString(),
        source: 'rotation_boost',
        planId,
        stripeSessionId: String(session.id)
      };

      items.unshift(record);
      await setStore(fmKey, items);
    }

    // Remove pending payload
    const nextPend = pend.slice(0, idx).concat(pend.slice(idx + 1));
    await setStore(pendingKey, nextPend);

    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    return { statusCode: 500, body: 'server error' };
  }
}
