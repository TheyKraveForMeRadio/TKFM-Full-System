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
    h['X-TKFM-OWNER_KEY'] ||
    '';
  const qs = event.queryStringParameters || {};
  const fromQuery = qs.owner_key || qs.ownerKey || '';
  return String(fromHeader || fromQuery || '').trim();
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const provided = getOwnerKey(event);
    const expected = (process.env.TKFM_OWNER_KEY || '').trim();

    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    const body = event.body ? JSON.parse(event.body) : {};
    const items = Array.isArray(body.items) ? body.items : null;

    const seed = items || [
      { title: 'TKFM Featured — YouTube', url: 'https://www.youtube.com/' , kind: 'link' },
      { title: 'TKFM Featured — SoundCloud', url: 'https://soundcloud.com/', kind: 'link' }
    ];

    const now = new Date().toISOString();
    const fmKey = 'featured_media';
    const fm = (await getStore(fmKey)) || [];

    const next = seed.map((x) => ({
      id: `fm_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      title: String(x.title || 'Featured').slice(0, 160),
      url: String(x.url || '').slice(0, 1000),
      kind: String(x.kind || 'link').slice(0, 40),
      addedAt: now,
      source: 'seed'
    })).filter(x => x.url);

    await setStore(fmKey, next.concat(fm).slice(0, 60));

    return json(200, { ok: true, added: next.length });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
