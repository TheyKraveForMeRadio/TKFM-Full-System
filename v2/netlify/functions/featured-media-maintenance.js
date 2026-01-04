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

function getCronKey(event) {
  const h = event.headers || {};
  const fromHeader =
    h['x-internal-cron-key'] ||
    h['X-INTERNAL-CRON-KEY'] ||
    h['x-internal_cron_key'] ||
    h['X_INTERNAL_CRON_KEY'] ||
    '';
  const qs = event.queryStringParameters || {};
  const fromQuery = qs.cron_key || qs.cronKey || '';
  return String(fromHeader || fromQuery || '').trim();
}

function normUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  return s.replace(/^http:\/\//i, 'https://');
}

function parseMs(v) {
  const ms = Date.parse(String(v || ''));
  return Number.isFinite(ms) ? ms : 0;
}

function isExpiredBoost(item, nowMs) {
  const until = parseMs(item.boostUntil);
  if (!until) return false;
  return until < nowMs;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
      return json(405, { ok: false, error: 'Method not allowed' });
    }

    const ownerExpected = (process.env.TKFM_OWNER_KEY || '').trim();
    const cronExpected = (process.env.INTERNAL_CRON_KEY || '').trim();

    const ownerProvided = getOwnerKey(event);
    const cronProvided = getCronKey(event);

    const authedOwner = ownerExpected && ownerProvided && ownerProvided === ownerExpected;
    const authedCron = cronExpected && cronProvided && cronProvided === cronExpected;

    if (!authedOwner && !authedCron) return json(401, { ok: false, error: 'Unauthorized' });

    const nowMs = Date.now();

    const body = event.body ? JSON.parse(event.body) : {};
    const keepMax = Math.max(50, Math.min(1000, Number(body.keepMax || 250)));

    const key = 'featured_media';
    const list = (await getStore(key)) || [];
    const items = Array.isArray(list) ? list : [];

    const before = items.length;

    // 1) Drop invalid
    let cleaned = items.filter((x) => {
      const url = normUrl(x && x.url);
      return url && url.length >= 8;
    });

    // 2) De-dupe by url (keep first occurrence)
    const seen = new Set();
    cleaned = cleaned.filter((x) => {
      const u = normUrl(x.url);
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });

    // 3) If boost expired, keep the item but remove boost fields (so it falls back to normal)
    cleaned = cleaned.map((x) => {
      if (!x || !x.boostUntil) return x;
      if (!isExpiredBoost(x, nowMs)) return x;
      const { boostUntil, boostedAt, planId, source, ...rest } = x;
      // Keep source if it wasn't a rotation_boost item
      const next = { ...rest };
      if (source && source !== 'rotation_boost') next.source = source;
      return next;
    });

    // 4) Hard prune ancient items by addedAt (older than 180d) to keep store fast
    const cutoffMs = nowMs - (180 * 24 * 60 * 60 * 1000);
    cleaned = cleaned.filter((x) => {
      const t = parseMs(x.addedAt || x.createdAt);
      if (!t) return true;
      return t >= cutoffMs;
    });

    // 5) Cap list
    cleaned = cleaned.slice(0, keepMax);

    await setStore(key, cleaned);

    return json(200, {
      ok: true,
      before,
      after: cleaned.length,
      removed: Math.max(0, before - cleaned.length),
      keepMax,
      note: 'Expired boosts are un-boosted (boostUntil removed); items may remain as normal featured.'
    });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
