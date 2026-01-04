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

function getOrigin(event) {
  const h = event.headers || {};
  const proto = (h['x-forwarded-proto'] || h['X-Forwarded-Proto'] || 'https').split(',')[0].trim();
  const host = (h['x-forwarded-host'] || h['X-Forwarded-Host'] || h['host'] || h['Host'] || '').split(',')[0].trim();
  if (!host) return 'https://www.tkfmradio.com';
  return `${proto}://${host}`;
}

function safeStr(v, max = 200) {
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

function makeToken() {
  return 'bp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const secret = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!secret) return json(500, { ok: false, error: 'Stripe secret key not configured' });

    const stripe = new Stripe(secret);

    const body = event.body ? JSON.parse(event.body) : {};
    const planId = safeStr(body.planId || body.plan_id, 80);
    const title = safeStr(body.title, 140) || 'Rotation Boost';
    const url = normalizeUrl(body.url);

    if (!planId) return json(400, { ok: false, error: 'Missing planId' });

    // Only allow boost plans through this endpoint
    if (!/^rotation_boost_(7d|30d)$/i.test(planId)) {
      return json(400, { ok: false, error: 'Invalid boost planId' });
    }

    // Require URL up front (this enables auto-submit via webhook)
    if (!url) return json(400, { ok: false, error: 'Missing url' });

    // Resolve price by lookup_key == planId
    const out = await stripe.prices.list({ active: true, lookup_keys: [planId], limit: 1 });
    const price = out && out.data && out.data[0] ? out.data[0] : null;
    if (!price || !price.id) return json(400, { ok: false, error: 'No active Stripe price for lookup_key planId' });

    // Store pending payload for webhook fulfillment
    const token = makeToken();
    const pendingKey = 'boost_pending';
    const pendingList = (await getStore(pendingKey)) || [];
    const pend = Array.isArray(pendingList) ? pendingList : [];

    pend.unshift({
      token,
      planId,
      title,
      url,
      createdAt: new Date().toISOString()
    });

    // Keep the list small
    const trimmed = pend.slice(0, 500);
    await setStore(pendingKey, trimmed);

    const origin = getOrigin(event);
    const successUrl = `${origin}/rotation-boost-success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/rotation-boost.html?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tkfm_lane: 'rotation_boost',
        planId,
        boostToken: token
      }
    });

    return json(200, { ok: true, url: session.url, id: session.id });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
