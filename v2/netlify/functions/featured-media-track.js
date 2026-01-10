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

function safeStr(v, max = 120) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function safeEvent(v) {
  const s = safeStr(v, 30).toLowerCase();
  if (s === 'impression' || s === 'click') return s;
  return '';
}

function todayKey() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const body = event.body ? JSON.parse(event.body) : {};
    const id = safeStr(body.id, 80);
    const ev = safeEvent(body.event);

    if (!id) return json(400, { ok: false, error: 'Missing id' });
    if (!ev) return json(400, { ok: false, error: 'Invalid event' });

    const storeKey = 'featured_media_stats';
    const list = (await getStore(storeKey)) || [];
    const stats = Array.isArray(list) ? list : [];

    const idx = stats.findIndex(x => String(x.id || '') === id);
    const nowIso = new Date().toISOString();
    const day = todayKey();

    const cur = idx >= 0 ? stats[idx] : { id, impressions: 0, clicks: 0, daily: {}, createdAt: nowIso };

    const next = { ...cur };
    next.updatedAt = nowIso;
    next.lastEvent = ev;
    next.lastSeenAt = nowIso;

    if (!next.daily || typeof next.daily !== 'object') next.daily = {};
    if (!next.daily[day]) next.daily[day] = { impressions: 0, clicks: 0 };

    if (ev === 'impression') {
      next.impressions = (Number(next.impressions) || 0) + 1;
      next.daily[day].impressions = (Number(next.daily[day].impressions) || 0) + 1;
    } else {
      next.clicks = (Number(next.clicks) || 0) + 1;
      next.daily[day].clicks = (Number(next.daily[day].clicks) || 0) + 1;
    }

    const out = stats.slice();
    if (idx >= 0) out[idx] = next;
    else out.unshift(next);

    // Keep store small
    await setStore(storeKey, out.slice(0, 2000));

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
