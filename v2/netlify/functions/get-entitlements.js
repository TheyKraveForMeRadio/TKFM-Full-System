import { supabaseEnabled, sbSelect } from './_supabase_rest.js';

function json(statusCode, obj) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(obj) };
}

export async function handler(event) {
  try {
    if (!supabaseEnabled()) return json(200, { ok: true, enabled: false, status: 'unknown', unlocks: [] });

    const qs = event.queryStringParameters || {};
    const customer_id = String(qs.customer_id || '').trim();
    if (!customer_id) return json(400, { ok: false, error: 'missing_customer_id' });

    const rows = await sbSelect('tkfm_entitlements', `select=*&customer_id=eq.${encodeURIComponent(customer_id)}&limit=1`);
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;

    if (!row) return json(200, { ok: true, enabled: true, found: false, status: 'unknown', unlocks: [] });

    return json(200, {
      ok: true,
      enabled: true,
      found: true,
      customer_id: row.customer_id,
      email: row.email || null,
      status: row.status || 'unknown',
      unlocks: row.unlocks || []
    });
  } catch (e) {
    return json(500, { ok: false, error: 'get_failed', message: String(e?.message || e) });
  }
}
