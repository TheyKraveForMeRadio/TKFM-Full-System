import { setStore } from './_helpers.js';

function ok(body) {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
function bad(code, msg) {
  return { statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok:false, error: msg }) };
}

function isHHMM(s) {
  return typeof s === 'string' && /^\d{2}:\d{2}$/.test(s);
}

export async function handler(event) {
  const key = event.headers['x-tkfm-owner-key'] || event.headers['X-TKFM-Owner-Key'];
  if (!process.env.TKFM_OWNER_KEY) return bad(500, 'Missing TKFM_OWNER_KEY env var');
  if (!key || key !== process.env.TKFM_OWNER_KEY) return bad(401, 'Unauthorized');
  if (event.httpMethod !== 'POST') return bad(405, 'Method not allowed');

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch(e) {}

  const slots = Array.isArray(payload.slots) ? payload.slots : [];
  if (!slots.length) return bad(400, 'No slots');

  const cleaned = [];
  for (const s of slots) {
    const day = Math.max(0, Math.min(6, parseInt(s.day,10) || 0));
    const type = String(s.type || 'radio').trim();
    const start = String(s.start || '').trim();
    const end = String(s.end || '').trim();
    const title = String(s.title || '').trim();
    const creator = String(s.creator || '').trim();
    const url = String(s.url || '').trim();

    if (!title || !isHHMM(start) || !isHHMM(end)) continue;

    cleaned.push({ day, type, start, end, title, creator, url });
  }

  await setStore('show_schedule', { slots: cleaned, updatedAt: Date.now() });
  return ok({ ok:true, count: cleaned.length });
}
