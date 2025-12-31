import jwt from 'jsonwebtoken';

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(obj)
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const secret =
    process.env.OWNER_JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    process.env.JWT_SECRET;

  if (!secret) {
    return json(500, { ok: false, error: 'Missing OWNER_JWT_SECRET / ADMIN_JWT_SECRET / JWT_SECRET' });
  }

  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  // Token check mode
  if (bearer) {
    try {
      const payload = jwt.verify(bearer, secret);
      if (!payload || payload.role !== 'owner') return json(401, { ok: false, error: 'Invalid token' });
      return json(200, { ok: true, role: 'owner' });
    } catch (e) {
      return json(401, { ok: false, error: 'Token expired or invalid' });
    }
  }

  // Credential login mode
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }

  const email = (body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const ownerKey = String(body.owner_key || '');

  const envEmail = String(process.env.OWNER_EMAIL || '').trim().toLowerCase();
  const envPassword = String(process.env.OWNER_PASSWORD || '');
  const envOwnerKey = String(process.env.TKFM_OWNER_KEY || '');

  if (!envEmail || !envPassword || !envOwnerKey) {
    return json(500, { ok: false, error: 'Missing OWNER_EMAIL / OWNER_PASSWORD / TKFM_OWNER_KEY in Netlify env' });
  }

  if (email !== envEmail || password !== envPassword || ownerKey !== envOwnerKey) {
    return json(401, { ok: false, error: 'Invalid owner credentials' });
  }

  const token = jwt.sign(
    { role: 'owner', email: envEmail },
    secret,
    { expiresIn: '12h' }
  );

  return json(200, { ok: true, role: 'owner', token, expires_in_seconds: 60 * 60 * 12 });
}
