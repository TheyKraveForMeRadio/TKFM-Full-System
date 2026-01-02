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

  const cfg = (await getStore('tv_config')) || {};
  const pinnedId = String(payload.pinnedId || '').trim();
  const rotateSecondsRaw = parseInt(payload.rotateSeconds || cfg.rotateSeconds || 120, 10);
  const rotateSeconds = Math.max(30, rotateSecondsRaw || 120);

  cfg.pinnedId = pinnedId;
  cfg.rotateSeconds = rotateSeconds;
  cfg.updatedAt = Date.now();

  await setStore('tv_config', cfg);
  return ok({ ok:true, pinnedId: cfg.pinnedId, rotateSeconds: cfg.rotateSeconds });
}
