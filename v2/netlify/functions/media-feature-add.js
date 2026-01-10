import { getStore, setStore } from './_helpers.js';

function json(statusCode, obj) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) };
}

function isOwner(event) {
  const key =
    (event.headers && (event.headers['x-tkfm-owner-key'] || event.headers['X-Tkfm-Owner-Key'])) ||
    (event.queryStringParameters && event.queryStringParameters.key) ||
    '';
  const ok = key && (key === process.env.TKFM_OWNER_KEY || key === process.env.INTERNAL_CRON_KEY);
  return !!ok;
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok:false, error:'POST only' });
  if (!isOwner(event)) return json(401, { ok:false, error:'owner only' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch {}

  const title = (body.title || '').trim();
  const url = (body.url || body.link || '').trim();
  const lane = (body.lane || '').trim();
  const type = (body.type || body.kind || '').trim() || (lane.startsWith('video_') ? 'video' : 'media');

  if (!title || !url) return json(400, { ok:false, error:'title+url required' });

  const item = {
    id: body.id || `feat_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: Date.now(),
    title,
    url,
    link: url,
    src: url,
    type,
    kind: type,
    lane
  };

  // Write to both keys (covers older implementations)
  const keys = ['featured_media', 'media_featured', 'featured_tv'];
  for (const k of keys) {
    const list = (await getStore(k)) || [];
    list.unshift(item);
    await setStore(k, list);
  }

  return json(200, { ok:true, item });
}
