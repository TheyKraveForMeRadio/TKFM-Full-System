import { getStore, setStore } from './_helpers.js';

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-TKFM-Owner-Key',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    },
    body: JSON.stringify(obj)
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'GET') return json(405, { error: 'GET only' });

  const qs = event.queryStringParameters || {};
  const type = String(qs.type || '').toLowerCase().trim();
  const limit = Math.max(1, Math.min(60, parseInt(qs.limit || '18', 10) || 18));

  const store = (await getStore('media_shows')) || [];

  let items = store.filter(x => x && x.approved === true && x.status !== 'deleted');
  if (type === 'podcast' || type === 'video') items = items.filter(x => x.type === type);

  items = items.slice(0, limit).map(x => ({
    id: x.id,
    type: x.type,
    title: x.title,
    description: x.description,
    primaryUrl: x.primaryUrl,
    secondaryUrl: x.secondaryUrl,
    coverUrl: x.coverUrl,
    creatorName: x.creatorName,
    tags: x.tags || [],
    createdAt: x.createdAt
  }));

  return json(200, { ok: true, items });
}
