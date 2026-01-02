import { getStore, setStore } from './_helpers.js';

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-TKFM-Owner-Key',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify(obj)
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid JSON' }); }

  const type = String(body.type || '').toLowerCase().trim();
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const primaryUrl = String(body.primaryUrl || '').trim();
  const secondaryUrl = String(body.secondaryUrl || '').trim();
  const coverUrl = String(body.coverUrl || '').trim();
  const creatorName = String(body.creatorName || '').trim();
  const email = String(body.email || '').trim();
  const tags = Array.isArray(body.tags) ? body.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 10) : [];

  if (!['podcast','video'].includes(type)) return json(400, { error: 'type must be podcast|video' });
  if (!title || title.length < 2) return json(400, { error: 'title required' });
  if (!primaryUrl || primaryUrl.length < 8) return json(400, { error: 'primaryUrl required' });

  const id = 'm_' + Math.random().toString(16).slice(2) + Date.now().toString(16);

  const item = {
    id,
    type,
    title,
    description: description.slice(0, 280),
    primaryUrl,
    secondaryUrl,
    coverUrl,
    creatorName: creatorName.slice(0, 80),
    email: email.slice(0, 120),
    tags,
    status: 'pending',
    approved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const store = (await getStore('media_shows')) || [];
  store.unshift(item);
  await setStore('media_shows', store);

  return json(200, { ok: true, id });
}
