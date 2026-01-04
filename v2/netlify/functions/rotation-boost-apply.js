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

function safeStr(v, max = 2000) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const provided = getOwnerKey(event);
    const expected = (process.env.TKFM_OWNER_KEY || '').trim();
    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    const body = event.body ? JSON.parse(event.body) : {};
    const url = safeStr(body.url, 1000);
    const title = safeStr(body.title, 160) || 'Rotation Boost';
    const laneId = safeStr(body.laneId, 120) || 'rotation_boost';
    const days = Number(body.days || 7);

    if (!url) return json(400, { ok: false, error: 'Missing url' });

    const fmKey = 'featured_media';
    const list = (await getStore(fmKey)) || [];
    const now = new Date().toISOString();

    // find item by url
    const idx = list.findIndex(x => String(x.url || x.link || '') === url);
    const boosted = {
      id: `fm_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      title,
      url,
      kind: 'link',
      addedAt: now,
      source: 'rotation_boost',
      laneId,
      boostUntil: new Date(Date.now() + Math.max(1, days) * 24 * 60 * 60 * 1000).toISOString()
    };

    let next;
    if (idx >= 0) {
      const existing = list[idx];
      // remove old, reinsert boosted on top preserving some metadata
      list.splice(idx, 1);
      next = [ { ...existing, ...boosted } , ...list ];
    } else {
      next = [ boosted, ...list ];
    }

    await setStore(fmKey, next.slice(0, 60));
    return json(200, { ok: true });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
