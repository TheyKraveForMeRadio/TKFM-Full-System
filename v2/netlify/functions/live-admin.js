import { getStore, setStore } from './_helpers.js';

function ok(body) {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
function bad(code, msg) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok:false, error: msg }) };
}

export async function handler(event) {
  const key = event.headers['x-tkfm-owner-key'] || event.headers['X-TKFM-Owner-Key'];
  if (!process.env.TKFM_OWNER_KEY) return bad(500, 'Missing TKFM_OWNER_KEY env var');
  if (!key || key !== process.env.TKFM_OWNER_KEY) return bad(401, 'Unauthorized');
  if (event.httpMethod !== 'POST') return bad(405, 'Method not allowed');

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch(e) {}

  const action = String(payload.action || '').trim();
  const id = String(payload.id || '').trim();
  const minutesRaw = parseInt(payload.minutes || 60, 10);
  const minutes = Math.max(10, Math.min(240, minutesRaw || 60));

  const store = (await getStore('live_queue')) || [];
  const list = Array.isArray(store) ? store : [];

  function updateStatus(targetId, status) {
    const idx = list.findIndex(x => x.id === targetId);
    if (idx < 0) return false;
    list[idx].status = status;
    list[idx].updatedAt = Date.now();
    if (status === 'approved') list[idx].approvedAt = Date.now();
    if (status === 'denied') list[idx].deniedAt = Date.now();
    return true;
  }

  if (action === 'stop') {
    await setStore('live_active', null);
    await setStore('live_queue', list);
    return ok({ ok:true });
  }

  if (!id) return bad(400, 'Missing id');

  if (action === 'approve') {
    const ok1 = updateStatus(id, 'approved');
    await setStore('live_queue', list);
    if (!ok1) return bad(404, 'Not found');
    return ok({ ok:true });
  }

  if (action === 'deny') {
    const ok1 = updateStatus(id, 'denied');
    await setStore('live_queue', list);
    if (!ok1) return bad(404, 'Not found');
    return ok({ ok:true });
  }

  if (action === 'go_live') {
    const idx = list.findIndex(x => x.id === id);
    if (idx < 0) return bad(404, 'Not found');

    // auto-approve if not already
    if (list[idx].status !== 'approved') {
      list[idx].status = 'approved';
      list[idx].approvedAt = Date.now();
    }

    const req = list[idx];
    const active = {
      requestId: req.id,
      title: req.title,
      creator: req.creator,
      type: req.type,
      url: req.url,
      description: req.description || '',
      startedAt: Date.now(),
      endsAt: Date.now() + (minutes * 60 * 1000)
    };

    await setStore('live_active', active);
    await setStore('live_queue', list);
    return ok({ ok:true });
  }

  return bad(400, 'Unknown action');
}
