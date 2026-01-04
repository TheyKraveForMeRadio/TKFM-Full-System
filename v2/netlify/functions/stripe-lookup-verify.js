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

function getOwnerKey(event) {
  const h = event.headers || {};
  const fromHeader =
    h['x-tkfm-owner-key'] ||
    h['X-TKFM-OWNER-KEY'] ||
    h['x-tkfm-owner_key'] ||
    h['X-TKFM_OWNER_KEY'] ||
    '';
  const qs = event.queryStringParameters || {};
  const fromQuery = qs.owner_key || qs.ownerKey || '';
  return String(fromHeader || fromQuery || '').trim();
}

function toArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const expected = (process.env.TKFM_OWNER_KEY || '').trim();
    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });

    const provided = getOwnerKey(event);
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    const secret = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!secret) return json(500, { ok: false, error: 'Stripe secret key not configured' });

    const stripe = new Stripe(secret);

    const body = event.body ? JSON.parse(event.body) : {};
    const lookupKeys = toArray(body.lookupKeys || body.lookup_keys || body.keys);
    if (!lookupKeys.length) return json(400, { ok: false, error: 'Missing lookupKeys' });

    const found = {};
    const missing = [];

    // Stripe allows up to 10 lookup_keys per list call; chunk safely.
    const chunkSize = 10;
    for (let i = 0; i < lookupKeys.length; i += chunkSize) {
      const chunk = lookupKeys.slice(i, i + chunkSize);
      const out = await stripe.prices.list({ active: true, lookup_keys: chunk, limit: 100 });
      const prices = (out && out.data) ? out.data : [];
      for (const lk of chunk) {
        const match = prices.find(p => p.lookup_key === lk);
        if (match && match.id) {
          found[lk] = {
            id: match.id,
            unit_amount: match.unit_amount,
            currency: match.currency,
            type: match.type,
            product: match.product
          };
        }
      }
      for (const lk of chunk) {
        if (!found[lk]) missing.push(lk);
      }
    }

    return json(200, {
      ok: true,
      found,
      missing
    });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
