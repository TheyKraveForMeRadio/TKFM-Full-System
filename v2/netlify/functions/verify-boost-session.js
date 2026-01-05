import Stripe from 'stripe';

/**
 * TKFM: Verify Boost Checkout Session (server-side)
 *
 * POST JSON:
 *   { "session_id": "cs_..." }
 *
 * Returns:
 *   { ok:true, lookup:"rotation_boost_7d|rotation_boost_30d", duration_days:7|30, paid:true }
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
      return { statusCode: 200, body: JSON.stringify({ ok:true, paid:false, payment_status: session.payment_status || null }) };
    }

    // Determine lookup key:
    // 1) metadata from dedicated endpoint
    let lookup = (session.metadata && (session.metadata.tkfm_lookup || session.metadata.lookup_key || session.metadata.lookup || '')) || '';

    // 2) infer from line item price id against env
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

    if (!lookup || !duration_days) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok:true,
          paid:true,
          lookup: lookup || null,
          duration_days: duration_days || null,
          warning: 'Paid, but could not infer boost lookup key. Check env price ids + metadata.',
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok:true,
        paid:true,
        lookup,
        duration_days,
        session_id: session.id,
        amount_total: session.amount_total || null,
        currency: session.currency || null,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: String(err?.message || err || 'Unknown error') }) };
  }
}
