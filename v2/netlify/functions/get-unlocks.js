const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function buildFeatureMap(rows) {
  const feats = {};
  let tier = null;

  for (const r of rows) {
    const unlock = r.unlock || {};
    const unlock_id = r.unlock_id || null;

    if (unlock_id) feats[unlock_id] = { ok: true, at: Date.parse(r.created_at) || Date.now() };

    if (unlock && Array.isArray(unlock.features)) {
      for (const f of unlock.features) feats[f] = { ok: true, at: Date.parse(r.created_at) || Date.now() };
    }

    if (unlock && unlock.tier) tier = unlock.tier;
  }

  return { feats, tier };
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const body = JSON.parse(event.body || '{}');
    const email = (body.email || '').trim().toLowerCase();
    if (!email) return { statusCode: 400, body: JSON.stringify({ error: 'Missing email' }) };

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }) };
    }

    const url = `${SUPABASE_URL}/rest/v1/tkfm_unlocks?select=session_id,customer_email,unlock_id,unlock,created_at&customer_email=eq.${encodeURIComponent(email)}&order=created_at.desc`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    const rows = await res.json().catch(() => []);
    if (!res.ok) return { statusCode: 500, body: JSON.stringify({ error: 'Supabase read failed', detail: rows }) };

    const { feats, tier } = buildFeatureMap(Array.isArray(rows) ? rows : []);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, email, tier, features: feats, rows: (Array.isArray(rows) ? rows.length : 0) })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || String(err) }) };
  }
}
