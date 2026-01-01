import { getStore, json } from './_helpers.js';
import { supabaseEnabled, sbSelect } from './_supabase_rest.js';

function ownerOk(event) {
  const key = String(event?.headers?.['x-owner-key'] || event?.headers?.['X-Owner-Key'] || '').trim();
  return key && key === String(process.env.TKFM_OWNER_KEY || '').trim();
}

export async function handler(event) {
  try {
    if (!ownerOk(event)) return json(401, { ok: false, error: 'unauthorized' });

    // PROD: Supabase
    if (supabaseEnabled()) {
      const orders = await sbSelect(
        'mixtape_orders',
        'select=*&order=created_at.desc&limit=200'
      );

      return json(200, { ok: true, storage: 'supabase', count: (orders || []).length, orders: (orders || []) });
    }

    // DEV fallback: local file store (matches old owner page shape)
    const orders = await getStore('mixtape_orders', []);
    return json(200, { ok: true, storage: 'local_dev', count: orders.length, orders });
  } catch (e) {
    return json(500, { ok: false, error: 'list_failed', message: String(e?.message || e) });
  }
}
