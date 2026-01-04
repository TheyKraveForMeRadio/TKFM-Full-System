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

function safeInt(v, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function parseUntil(v) {
  const s = String(v || '').trim();
  if (!s) return 0;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : 0;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const expected = (process.env.TKFM_OWNER_KEY || '').trim();
    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });

    const provided = getOwnerKey(event);
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    const body = event.body ? JSON.parse(event.body) : {};
    const id = String(body.id || '').trim();
    if (!id) return json(400, { ok: false, error: 'Missing id' });

    const days = safeInt(body.days, 0);
    const untilProvided = parseUntil(body.until);

    let boostUntil = 0;
    if (untilProvided) {
      boostUntil = untilProvided;
    } else if (days > 0) {
      boostUntil = Date.now() + (days * 24 * 60 * 60 * 1000);
    } else {
      return json(400, { ok: false, error: 'Provide days or until' });
    }

    const fmKey = 'featured_media';
    const list = (await getStore(fmKey)) || [];
    const items = Array.isArray(list) ? list : [];

    const idx = items.findIndex(x => String(x.id || '') === id);
    if (idx === -1) return json(404, { ok: false, error: 'Not found' });

    const next = items.slice();
    next[idx] = {
      ...next[idx],
      boostUntil: new Date(boostUntil).toISOString(),
      boostedAt: new Date().toISOString()
    };

    await setStore(fmKey, next);
    return json(200, { ok: true, id, boostUntil: next[idx].boostUntil });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
