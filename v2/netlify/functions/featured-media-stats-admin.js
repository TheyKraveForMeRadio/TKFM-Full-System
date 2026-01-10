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

export async function handler(event) {
  try {
    const expected = (process.env.TKFM_OWNER_KEY || '').trim();
    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });

    const provided = getOwnerKey(event);
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    const key = 'featured_media_stats';

    if (event.httpMethod === 'GET') {
      const list = (await getStore(key)) || [];
      const stats = Array.isArray(list) ? list : [];
      return json(200, { ok: true, stats });
    }

    if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const action = String(body.action || '').trim();

      if (action === 'reset_all') {
        await setStore(key, []);
        return json(200, { ok: true });
      }

      return json(400, { ok: false, error: 'Unknown action' });
    }

    return json(405, { ok: false, error: 'Method not allowed' });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
