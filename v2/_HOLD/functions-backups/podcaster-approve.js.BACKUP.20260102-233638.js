import { getStore, setStore } from './_helpers.js';
import { requireOwnerFromEvent } from './_owner.js';

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok:false, error:'Method not allowed' });

  // Owner auth (server)
  const gate = await requireOwnerFromEvent(event);
  if (!gate.ok) return json(gate.statusCode || 403, { ok:false, error: gate.error || 'Owner only' });

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch (e) {}

  const slug = String(payload.slug || '').trim().toLowerCase();
  if (!slug) return json(400, { ok:false, error:'Missing slug' });

  const approved = payload.approved === true;
  const featured = payload.featured === true;
  const featuredRank = Number.isFinite(payload.featuredRank) ? payload.featuredRank : parseInt(payload.featuredRank || '0', 10) || 0;
  const featuredUntil = String(payload.featuredUntil || '').trim(); // ISO date/time or '' for none

  const store = (await getStore('podcaster_profiles')) || [];
  const idx = store.findIndex(x => x && String(x.slug||'').toLowerCase() === slug);
  if (idx < 0) return json(404, { ok:false, error:'Profile not found' });

  const now = new Date().toISOString();
  store[idx] = {
    ...store[idx],
    approved,
    featured,
    featuredRank,
    featuredUntil,
    reviewedAt: now
  };

  await setStore('podcaster_profiles', store);

  return json(200, { ok:true, slug, profile: store[idx] });
}
