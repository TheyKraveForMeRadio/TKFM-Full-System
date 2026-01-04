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

function getOwnerKey(event) {
  const h = event.headers || {};
  const fromHeader =
    h['x-tkfm-owner-key'] ||
    h['X-TKFM-OWNER-KEY'] ||
    h['x-tkfm-owner_key'] ||
    h['X-TKFM-OWNER_KEY'] ||
    '';
  const qs = event.queryStringParameters || {};
  const fromQuery = qs.owner_key || qs.ownerKey || '';
  return String(fromHeader || fromQuery || '').trim();
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

    const provided = getOwnerKey(event);
    const expected = (process.env.TKFM_OWNER_KEY || '').trim();

    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    const storeKey = 'paid_lane_submissions';
    const list = (await getStore(storeKey)) || [];
    list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

    return json(200, { ok: true, items: list });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
