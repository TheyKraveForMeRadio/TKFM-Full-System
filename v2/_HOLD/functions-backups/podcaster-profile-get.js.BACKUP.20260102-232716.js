import { getStore } from './_helpers.js';

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export async function handler(event) {
  const qs = event.queryStringParameters || {};
  const slug = String(qs.slug || '').trim().toLowerCase();
  const store = (await getStore('podcaster_profiles')) || [];

  if (slug) {
    const profile = store.find(x => x && String(x.slug||'').toLowerCase() === slug) || null;
    return json(200, { ok:true, profile });
  }

  // list
  const limit = Math.max(1, Math.min(50, parseInt(qs.limit || '24', 10) || 24));
  return json(200, { ok:true, profiles: store.slice(0, limit) });
}
