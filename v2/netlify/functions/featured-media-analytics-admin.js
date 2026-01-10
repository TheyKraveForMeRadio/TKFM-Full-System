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
  const qs = event.queryStringParameters || {};
  const fromHeader =
    h['x-tkfm-owner-key'] ||
    h['X-TKFM-OWNER-KEY'] ||
    h['x-tkfm-owner_key'] ||
    h['X-TKFM_OWNER_KEY'] ||
    '';
  const fromQuery = qs.owner_key || qs.ownerKey || '';
  return String(fromHeader || fromQuery || '').trim();
}

function num(x) { const n = Number(x); return Number.isFinite(n) ? n : 0; }

function parseMs(t) {
  if (!t) return 0;
  const ms = Date.parse(String(t));
  return Number.isFinite(ms) ? ms : 0;
}

function todayKey(d=new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  const day = String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function lastNDaysKeys(n=7) {
  const keys = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    keys.push(todayKey(d));
  }
  return keys;
}

function sumDaily(stat, keys) {
  const daily = (stat && stat.daily) || {};
  let imp = 0;
  let clk = 0;
  keys.forEach(k => {
    const row = daily[k];
    if (!row) return;
    imp += num(row.impressions);
    clk += num(row.clicks);
  });
  return { impressions: imp, clicks: clk };
}

export async function handler(event) {
  try {
    const expected = String(process.env.TKFM_OWNER_KEY || '').trim();
    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });

    const provided = getOwnerKey(event);
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    const featuredKey = 'featured_media';
    const statsKey = 'featured_media_stats';

    const items = (await getStore(featuredKey)) || [];
    const stats = (await getStore(statsKey)) || [];

    const list = Array.isArray(items) ? items : [];
    const statList = Array.isArray(stats) ? stats : [];

    const byId = new Map(statList.map(s => [String(s && s.id || ''), s]).filter(([k]) => k));

    const now = Date.now();
    const last7Keys = lastNDaysKeys(7);

    const out = list.map((it) => {
      const id = String(it && it.id || '').trim();
      const st = id ? (byId.get(id) || null) : null;

      const impressions = st ? num(st.impressions) : 0;
      const clicks = st ? num(st.clicks) : 0;
      const ctr = impressions ? (clicks / impressions) : 0;

      const last7 = st ? sumDaily(st, last7Keys) : { impressions: 0, clicks: 0 };
      const last7Ctr = last7.impressions ? (last7.clicks / last7.impressions) : 0;

      const boostUntilMs = parseMs(it && it.boostUntil);
      const boostedActive = boostUntilMs ? (now < boostUntilMs) : false;
      const boostedExpired = boostUntilMs ? (now >= boostUntilMs) : false;
      const daysLeft = boostUntilMs ? Math.ceil((boostUntilMs - now) / 86400000) : 0;

      return {
        ...it,
        id,
        stats: {
          impressions,
          clicks,
          ctr,
          last7Impressions: last7.impressions,
          last7Clicks: last7.clicks,
          last7Ctr
        },
        boost: {
          boostUntil: it && it.boostUntil || '',
          boostedActive,
          boostedExpired,
          daysLeft
        }
      };
    });

    // Default sort: boosted active first, then clicks desc, then impressions desc
    out.sort((a, b) => {
      const ba = a?.boost?.boostedActive ? 1 : 0;
      const bb = b?.boost?.boostedActive ? 1 : 0;
      if (bb !== ba) return bb - ba;

      const cb = num(b?.stats?.clicks);
      const ca = num(a?.stats?.clicks);
      if (cb !== ca) return cb - ca;

      const ib = num(b?.stats?.impressions);
      const ia = num(a?.stats?.impressions);
      return ib - ia;
    });

    return json(200, { ok: true, items: out, total: out.length });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
