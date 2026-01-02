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

function isOwner(event) {
  const key = (event.headers?.['x-tkfm-owner-key'] || event.headers?.['X-TKFM-Owner-Key'] || '').toString().trim();
  const envKey = (process.env.TKFM_OWNER_KEY || '').toString().trim();
  if (!envKey) return true; // dev fallback
  return key && key === envKey;
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (!isOwner(event)) return json(401, { error: 'Unauthorized' });

  if (event.httpMethod === 'GET') {
    const store = (await getStore('media_shows')) || [];
    return json(200, { ok: true, items: store });
  }

  if (event.httpMethod !== 'POST') return json(405, { error: 'GET|POST only' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid JSON' }); }

  const action = String(body.action || '').toLowerCase().trim();
  const id = String(body.id || '').trim();
  if (!id) return json(400, { error: 'id required' });

  const store = (await getStore('media_shows')) || [];
  const idx = store.findIndex(x => x && x.id === id);
  if (idx === -1) return json(404, { error: 'not found' });

  const item = store[idx];

  if (action === 'approve') {
    item.approved = true;
    item.status = 'approved';
  } else if (action === 'unapprove') {
    item.approved = false;
    item.status = 'pending';
  } else if (action === 'delete') {
    item.approved = false;
    item.status = 'deleted';
  } else if (action === 'edit') {
    const patch = body.patch || {};
    if (typeof patch.title === 'string') item.title = patch.title.slice(0, 120);
    if (typeof patch.description === 'string') item.description = patch.description.slice(0, 280);
    if (typeof patch.primaryUrl === 'string') item.primaryUrl = patch.primaryUrl.slice(0, 300);
    if (typeof patch.secondaryUrl === 'string') item.secondaryUrl = patch.secondaryUrl.slice(0, 300);
    if (typeof patch.coverUrl === 'string') item.coverUrl = patch.coverUrl.slice(0, 300);
    if (typeof patch.creatorName === 'string') item.creatorName = patch.creatorName.slice(0, 80);
    if (Array.isArray(patch.tags)) item.tags = patch.tags.map(t => String(t).trim()).filter(Boolean).slice(0,10);
  } else {
    return json(400, { error: 'action must be approve|unapprove|delete|edit' });
  }

  item.updatedAt = new Date().toISOString();
  store[idx] = item;
  await setStore('media_shows', store);

  return json(200, { ok: true });
}
