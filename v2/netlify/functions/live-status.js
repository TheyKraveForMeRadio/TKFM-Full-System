import { getStore } from './_helpers.js';

export async function handler(event) {
  const qs = event.queryStringParameters || {};
  const id = String(qs.id || '').trim();
  if (!id) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok:false, error:'Missing id' }) };
  }

  const store = (await getStore('live_queue')) || [];
  const list = Array.isArray(store) ? store : [];
  const req = list.find(x => x.id === id) || null;

  const active = (await getStore('live_active')) || null;
  const isActive = !!(active && active.requestId && active.requestId === id && (!active.endsAt || Date.now() <= active.endsAt));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request: req ? { ...req, active: isActive } : null })
  };
}
