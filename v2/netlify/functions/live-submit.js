import { getStore, setStore } from './_helpers.js';
import { requireActivePlansByEmail } from './_entitlement.js';

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function uid() {
  return 'live_' + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// REQUIRED monthly access for live casts:
const REQUIRED_PLANS = ['video_creator_pass_monthly'];

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch (e) {}

  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) return json(403, { ok: false, error: 'Missing email. Complete checkout once so we can verify monthly access.' });

  // SERVER GATE: verify active subscription
  try {
    const gate = await requireActivePlansByEmail(email, REQUIRED_PLANS);
    if (!gate.ok) return json(403, { ok: false, error: gate.error || 'Subscription check failed' });
    if (!gate.hasAny) return json(403, { ok: false, error: 'No active monthly subscription found for Live casts.' });
  } catch (e) {
    return json(502, { ok: false, error: 'Could not verify subscription right now.' });
  }

  const title = String(payload.title || '').trim();
  const creator = String(payload.creator || '').trim();
  const type = String(payload.type || 'podcast').trim();
  const url = String(payload.url || '').trim();
  const description = String(payload.description || '').trim();
  const minutes = Math.max(10, parseInt(payload.minutes || '60', 10) || 60);

  if (!title || !url) return json(400, { ok: false, error: 'Missing title or url' });

  const store = (await getStore('live_requests')) || [];
  const id = uid();
  const now = new Date().toISOString();

  const req = {
    id,
    createdAt: now,
    updatedAt: now,
    email,
    title,
    creator,
    type,
    url,
    description,
    minutes,
    status: 'pending', // pending | approved | denied
    active: false
  };

  store.unshift(req);
  await setStore('live_requests', store);

  return json(200, { ok: true, id });
}
