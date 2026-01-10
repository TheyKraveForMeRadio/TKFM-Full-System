import crypto from 'crypto';

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok:false, error:'Method not allowed' });

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch (e) {}

  const email = String(payload.email || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();
  const ownerKey = String(payload.ownerKey || '').trim();

  const ENV_EMAIL = String(process.env.OWNER_EMAIL || '').trim().toLowerCase();
  const ENV_PASS = String(process.env.OWNER_PASSWORD || '').trim();
  const ENV_KEY  = String(process.env.TKFM_OWNER_KEY || process.env.OWNER_KEY || '').trim();

  // If env credentials exist, enforce them.
  if (ENV_EMAIL || ENV_PASS || ENV_KEY) {
    if (ENV_EMAIL && email !== ENV_EMAIL) return json(403, { ok:false, error:'Invalid owner email' });
    if (ENV_PASS && password !== ENV_PASS) return json(403, { ok:false, error:'Invalid owner password' });
    if (ENV_KEY && ownerKey !== ENV_KEY) return json(403, { ok:false, error:'Invalid owner key' });
  } else {
    // If env not configured, do not allow silent open access.
    return json(500, { ok:false, error:'Owner auth env not configured (set OWNER_EMAIL/OWNER_PASSWORD/TKFM_OWNER_KEY)' });
  }

  // Return an opaque session token for the client to store.
  const token = 'owner_' + crypto.randomBytes(18).toString('hex');
  return json(200, { ok:true, token, email });
}
