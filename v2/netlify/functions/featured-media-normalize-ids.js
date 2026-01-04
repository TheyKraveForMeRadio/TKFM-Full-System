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

function normUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  return s.replace(/^http:\/\//i, 'https://');
}

function hashDjb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h = h >>> 0;
  }
  return h;
}

function idFromUrl(url) {
  const u = normUrl(url);
  if (!u) return '';
  return 'fm_' + hashDjb2(u).toString(36);
}

export async function handler(event) {
  try {
    const expected = (process.env.TKFM_OWNER_KEY || '').trim();
    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });

    const provided = getOwnerKey(event);
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const key = 'featured_media';
    const list = (await getStore(key)) || [];
    const items = Array.isArray(list) ? list : [];

    let changed = 0;

    const next = items.map((x) => {
      const url = normUrl(x && x.url);
      if (!x) return x;
      if (x.id) return x;
      const id = idFromUrl(url);
      if (!id) return x;
      changed++;
      return { ...x, id };
    });

    if (changed) await setStore(key, next);

    return json(200, { ok: true, total: items.length, ids_added: changed });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
