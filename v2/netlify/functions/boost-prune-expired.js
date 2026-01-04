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

function parseTime(t) {
  const s = String(t || '').trim();
  if (!s) return 0;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : 0;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const provided = getOwnerKey(event);
    const expected = (process.env.TKFM_OWNER_KEY || '').trim();
    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    const fmKey = 'featured_media';
    const list = (await getStore(fmKey)) || [];
    const now = Date.now();

    let pruned = 0;
    const next = list.map((x) => {
      const until = parseTime(x.boostUntil);
      if (until && until <= now) {
        pruned += 1;
        const y = { ...x };
        delete y.boostUntil;
        y.lastBoostExpiredAt = new Date().toISOString();
        return y;
      }
      return x;
    });

    await setStore(fmKey, next);
    return json(200, { ok: true, pruned });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
