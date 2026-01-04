import Stripe from 'stripe';
import { getStore, setStore } from './_helpers.js';

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

function safeStr(v, max = 400) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function normalizeUrl(v) {
  let s = safeStr(v, 1000);
  if (!s) return '';
  if (!/^https?:\/\//i.test(s) && /^[a-z0-9.-]+\.[a-z]{2,}/i.test(s)) s = 'https://' + s;
  return s;
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
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const secret = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!secret) return json(500, { ok: false, error: 'Stripe secret key not configured' });

    const stripe = new Stripe(secret);

    const body = event.body ? JSON.parse(event.body) : {};
    const sessionId = safeStr(body.session_id || body.sessionId, 200);
    const title = safeStr(body.title, 140) || 'Rotation Boost';
    const url = normalizeUrl(body.url);

    if (!sessionId) return json(400, { ok: false, error: 'Missing session_id' });
    if (!url) return json(400, { ok: false, error: 'Missing url' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || !session.id) return json(404, { ok: false, error: 'Session not found' });

    const paid = session.payment_status === 'paid';
    if (!paid) return json(400, { ok: false, error: 'Session not paid' });

    const planId = (session.metadata && session.metadata.planId) ? String(session.metadata.planId) : '';
    const lane = (session.metadata && session.metadata.tkfm_lane) ? String(session.metadata.tkfm_lane) : '';
    if (lane !== 'rotation_boost') return json(400, { ok: false, error: 'Wrong lane' });

    const days = daysForPlan(planId);
    if (!days) return json(400, { ok: false, error: 'Invalid planId for rotation boost' });

    const now = Date.now();
    const boostUntilMs = now + (days * 24 * 60 * 60 * 1000);

    const fmKey = 'featured_media';
    const list = (await getStore(fmKey)) || [];
    const items = Array.isArray(list) ? list : [];

    // prevent duplicates for same session id
    if (items.some(x => String(x.stripeSessionId || '') === sessionId)) {
      return json(200, { ok: true, already: true });
    }

    const record = {
      id: makeId(),
      title,
      url,
      kind: 'link',
      addedAt: new Date(now).toISOString(),
      boostUntil: new Date(boostUntilMs).toISOString(),
      boostedAt: new Date(now).toISOString(),
      source: 'rotation_boost',
      planId,
      stripeSessionId: sessionId
    };

    items.unshift(record);
    await setStore(fmKey, items);

    return json(200, { ok: true, id: record.id, boostUntil: record.boostUntil });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
