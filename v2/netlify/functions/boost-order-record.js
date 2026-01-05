import Stripe from 'stripe';
import { getStore, setStore } from './_helpers.js';

/**
 * TKFM: Record a Boost order server-side (anti-fake)
 *
 * POST JSON: { session_id: "cs_..." }
 * - Retrieves session from Stripe
 * - Requires payment_status === 'paid'
 * - Infers lookup (metadata tkfm_lookup OR line item price id match env)
 * - Writes into store: boost_orders (append or update by session_id)
 *
 * Returns: { ok:true, recorded:true, order: {...} }
 */
export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ ok:false, error:'Method not allowed' }) };
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return { statusCode: 500, body: JSON.stringify({ ok:false, error:'Missing STRIPE_SECRET_KEY' }) };

    const stripe = new Stripe(stripeKey);

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }

    const sessionId = (body.session_id || body.sessionId || body.id || '').trim();
    if (!sessionId || !sessionId.startsWith('cs_')) {
      return { statusCode: 400, body: JSON.stringify({ ok:false, error:'Missing/invalid session_id' }) };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price', 'payment_intent'],
    });

    const paid = session.payment_status === 'paid';
    if (!paid) {
      return { statusCode: 200, body: JSON.stringify({ ok:true, recorded:false, paid:false, payment_status: session.payment_status || null }) };
    }

    let lookup = (session.metadata && (session.metadata.tkfm_lookup || session.metadata.lookup_key || session.metadata.lookup || '')) || '';
    const priceId = session?.line_items?.data?.[0]?.price?.id || '';

    const p7 = process.env.STRIPE_PRICE_ROTATION_BOOST_7D || '';
    const p30 = process.env.STRIPE_PRICE_ROTATION_BOOST_30D || '';

    if (!lookup) {
      if (priceId && p7 && priceId === p7) lookup = 'rotation_boost_7d';
      if (priceId && p30 && priceId === p30) lookup = 'rotation_boost_30d';
    }

    let duration_days = 0;
    if (lookup === 'rotation_boost_7d') duration_days = 7;
    if (lookup === 'rotation_boost_30d') duration_days = 30;

    const created = (session.created ? (session.created * 1000) : Date.now());
    const expires_at = created + (duration_days ? duration_days * 24 * 60 * 60 * 1000 : 0);

    const order = {
      session_id: session.id,
      lookup: lookup || null,
      duration_days: duration_days || null,
      amount_total: session.amount_total || null,
      currency: session.currency || null,
      customer_email: session.customer_details?.email || session.customer_email || null,
      created_at: created,
      expires_at: expires_at || null,
      livemode: !!session.livemode,
      price_id: priceId || null,
    };

    // Store: boost_orders
    const store = (await getStore('boost_orders')) || [];
    const idx = store.findIndex(o => o && o.session_id === order.session_id);

    if (idx >= 0) store[idx] = { ...store[idx], ...order };
    else store.unshift(order);

    await setStore('boost_orders', store);

    return { statusCode: 200, body: JSON.stringify({ ok:true, recorded:true, order }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: String(err?.message || err || 'Unknown error') }) };
  }
}
