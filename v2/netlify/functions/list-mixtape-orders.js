import { getStore, json } from './_helpers.js';

export async function handler(event) {
  try {
    const key = String(event?.headers?.['x-owner-key'] || event?.headers?.['X-Owner-Key'] || '').trim();
    if (!key || key !== String(process.env.TKFM_OWNER_KEY || '').trim()) {
      return json(401, { ok: false, error: 'unauthorized' });
    }

    const orders = await getStore('mixtape_orders', []);
    return json(200, { ok: true, count: orders.length, orders });
  } catch (e) {
    return json(500, { ok: false, error: 'list_failed', message: String(e?.message || e) });
  }
}
