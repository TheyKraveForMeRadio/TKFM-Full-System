import { getStore } from './_helpers.js';

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function isFeatured(p){
  if (!p || !p.featured) return false;
  if (!p.featuredUntil) return true;
  const t = Date.parse(p.featuredUntil);
  if (!Number.isFinite(t)) return true;
  return t > Date.now();
}

export async function handler(event) {
  const qs = event.queryStringParameters || {};
  const slug = String(qs.slug || '').trim().toLowerCase();
  const store = (await getStore('podcaster_profiles')) || [];

  // public detail view: allow even if not approved (but could hide in UI)
  if (slug) {
    const profile = store.find(x => x && String(x.slug||'').toLowerCase() === slug) || null;
    return json(200, { ok:true, profile });
  }

  const limit = Math.max(1, Math.min(80, parseInt(qs.limit || '24', 10) || 24));
  const onlyApproved = String(qs.approved || '1') !== '0';

  let list = store.slice();

  if (onlyApproved) list = list.filter(p => p && p.approved === true);

  // Featured first, then newest
  list.sort((a,b)=>{
    const af = isFeatured(a), bf = isFeatured(b);
    if (af !== bf) return bf ? 1 : -1; // featured true first
    const ar = parseInt(a && a.featuredRank ? a.featuredRank : 0, 10) || 0;
    const br = parseInt(b && b.featuredRank ? b.featuredRank : 0, 10) || 0;
    if (ar !== br) return br - ar; // higher rank first
    const at = Date.parse(a && (a.updatedAt || a.createdAt) || 0) || 0;
    const bt = Date.parse(b && (b.updatedAt || b.createdAt) || 0) || 0;
    return bt - at;
  });

  return json(200, { ok:true, profiles: list.slice(0, limit) });
}
