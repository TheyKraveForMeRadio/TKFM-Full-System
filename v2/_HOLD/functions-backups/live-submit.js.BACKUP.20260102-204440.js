import { getStore, setStore } from './_helpers.js';

function ok(body) {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
function bad(code, msg) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok:false, error: msg }) };
}

function id() {
  return 'lr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return bad(405, 'Method not allowed');

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch(e) {}

  const title = String(payload.title || '').trim();
  const creator = String(payload.creator || '').trim();
  const type = String(payload.type || 'podcast').trim();
  const url = String(payload.url || '').trim();
  const description = String(payload.description || '').trim();
  const minutesRaw = parseInt(payload.minutes || 60, 10);
  const minutes = Math.max(10, Math.min(240, minutesRaw || 60));

  if (!title || !url) return bad(400, 'Missing title or url');

  const store = (await getStore('live_queue')) || [];
  const req = {
    id: id(),
    title,
    creator,
    type: (type === 'video' ? 'video' : 'podcast'),
    url,
    description,
    minutes,
    status: 'pending',
    submittedAt: Date.now()
  };

  const next = Array.isArray(store) ? store : [];
  next.unshift(req);

  // cap queue
  while (next.length > 200) next.pop();

  await setStore('live_queue', next);
  return ok({ ok:true, id: req.id });
}
