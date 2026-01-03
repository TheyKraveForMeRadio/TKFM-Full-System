import { getStore, setStore } from './_helpers.js';

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function nowMs(){ return Date.now(); }

function isActive(item){
  if (!item) return false;
  if (item.enabled !== true) return false;
  if (!item.until) return true;
  const t = Date.parse(item.until);
  if (!Number.isFinite(t)) return true;
  return t > nowMs();
}

function normalize(list){
  const out = Array.isArray(list) ? list : [];
  return out
    .filter(isActive)
    .sort((a,b)=>{
      const ar = Number(a.rank||0), br = Number(b.rank||0);
      if (br !== ar) return br - ar;
      const at = Date.parse(a.createdAt||'') || 0;
      const bt = Date.parse(b.createdAt||'') || 0;
      return bt - at;
    });
}

export async function handler(event) {
  const qs = event.queryStringParameters || {};
  const kind = String(qs.kind || 'all').toLowerCase(); // all|podcast|video|press|artist
  const limit = Math.max(1, Math.min(100, parseInt(qs.limit || '24', 10) || 24));

  const store = (await getStore('featured_media')) || [];
  const active = normalize(store);

  const filtered = (kind === 'all')
    ? active
    : active.filter(x => String(x.kind||'').toLowerCase() === kind);

  return json(200, { ok:true, kind, count: filtered.length, items: filtered.slice(0, limit) });
}
