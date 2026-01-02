import { getStore } from './_helpers.js';

export async function handler(event) {
  const qs = event.queryStringParameters || {};
  const status = String(qs.status || '').trim();
  const limit = Math.max(1, Math.min(200, parseInt(qs.limit || 50, 10) || 50));

  const store = (await getStore('live_queue')) || [];
  const list = Array.isArray(store) ? store : [];

  const filtered = status ? list.filter(x => x.status === status) : list;
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: filtered.slice(0, limit) })
  };
}
