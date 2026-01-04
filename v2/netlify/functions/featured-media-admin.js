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
    const provided = getOwnerKey(event);
    const expected = (process.env.TKFM_OWNER_KEY || '').trim();
    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    const fmKey = 'featured_media';

    if (event.httpMethod === 'GET') {
      const list = (await getStore(fmKey)) || [];
      const items = Array.isArray(list) ? list : [];
      return json(200, { ok: true, items });
    }

    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const body = event.body ? JSON.parse(event.body) : {};
    const action = safeStr(body.action, 40);
    const id = safeStr(body.id, 240);

    const list = (await getStore(fmKey)) || [];
    const items = Array.isArray(list) ? list : [];

    if (action === 'delete') {
      if (!id) return json(400, { ok: false, error: 'Missing id' });
      const next = items.filter(x => String(x.id || '') !== id);
      await setStore(fmKey, next);
      return json(200, { ok: true });
    }

    if (action === 'move_top') {
      if (!id) return json(400, { ok: false, error: 'Missing id' });
      const idx = items.findIndex(x => String(x.id || '') === id);
      if (idx === -1) return json(404, { ok: false, error: 'Not found' });
      const [it] = items.splice(idx, 1);
      const next = [it, ...items];
      await setStore(fmKey, next);
      return json(200, { ok: true });
    }

    if (action === 'edit') {
      if (!id) return json(400, { ok: false, error: 'Missing id' });
      const title = safeStr(body.title, 160);
      const url = safeStr(body.url, 1000);
      const kind = safeStr(body.kind, 40);

      const idx = items.findIndex(x => String(x.id || '') === id);
      if (idx === -1) return json(404, { ok: false, error: 'Not found' });

      const now = new Date().toISOString();
      const next = items.slice();
      next[idx] = {
        ...next[idx],
        title: title || next[idx].title,
        url: url || next[idx].url,
        kind: kind || next[idx].kind || 'link',
        updatedAt: now
      };
      await setStore(fmKey, next);
      return json(200, { ok: true });
    }

    return json(400, { ok: false, error: 'Unknown action' });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
