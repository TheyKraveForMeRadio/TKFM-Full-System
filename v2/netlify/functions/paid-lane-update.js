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

async function featureToMedia(item, event) {
  // Local helper to avoid extra fetch; writes to common featured store keys
  const payload = {
    id: item.id,
    title: item.title,
    url: item.link,
    link: item.link,
    lane: item.lane,
    type: item.lane && item.lane.startsWith('video_') ? 'video' : 'media'
  };

  const keys = ['featured_media', 'media_featured', 'featured_tv'];
  for (const k of keys) {
    const list = (await getStore(k)) || [];
    list.unshift({ ...payload, createdAt: Date.now() });
    await setStore(k, list);
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok:false, error:'POST only' });
  if (!isOwner(event)) return json(401, { ok:false, error:'owner only' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch {}

  const id = (body.id || '').trim();
  const action = (body.action || '').trim(); // approve | reject | feature
  const status = (body.status || '').trim();

  if (!id) return json(400, { ok:false, error:'Missing id' });

  const storeKey = 'paid_lane_submissions';
  const list = (await getStore(storeKey)) || [];
  const idx = list.findIndex(x => x && x.id === id);
  if (idx === -1) return json(404, { ok:false, error:'Not found' });

  const item = list[idx];

  if (action === 'approve') item.status = 'approved';
  else if (action === 'reject') item.status = 'rejected';
  else if (action === 'feature') item.status = 'featured';
  else if (status) item.status = status;

  item.updatedAt = Date.now();
  list[idx] = item;
  await setStore(storeKey, list);

  if (item.status === 'featured') {
    await featureToMedia(item, event);
  }

  return json(200, { ok:true, item });
}
