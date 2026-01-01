import { getStore, setStore, json } from './_helpers.js';
import { supabaseEnabled, sbInsert } from './_supabase_rest.js';

function nowIso() { return new Date().toISOString(); }
function id() { return 'mix_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16); }

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

    const body = event.body ? JSON.parse(event.body) : {};
    const required = ['tier', 'artistName', 'email', 'mixtapeTitle'];
    for (const k of required) {
      if (!String(body[k] || '').trim()) return json(400, { ok: false, error: 'missing_field', field: k });
    }

    const order = {
      id: id(),
      created_at: nowIso(),
      status: 'new',
      tier: String(body.tier || '').trim(),

      artist_name: String(body.artistName || '').trim(),
      email: String(body.email || '').trim(),
      phone: String(body.phone || '').trim() || null,

      mixtape_title: String(body.mixtapeTitle || '').trim(),
      download: String(body.download || '').trim() || null,
      tracklist: String(body.tracklist || '').trim() || null,
      socials: String(body.socials || '').trim() || null,
      notes: String(body.notes || '').trim() || null
    };

    // PROD: Supabase (persistent)
    if (supabaseEnabled()) {
      const saved = await sbInsert('mixtape_orders', order);
      return json(200, { ok: true, storage: 'supabase', order: saved });
    }

    // DEV fallback: local file store
    const orders = await getStore('mixtape_orders', []);
    orders.unshift({
      id: order.id,
      createdAt: order.created_at,
      status: order.status,
      tier: order.tier,
      artistName: order.artist_name,
      email: order.email,
      phone: order.phone || '',
      mixtapeTitle: order.mixtape_title,
      notes: order.notes || '',
      links: {
        download: order.download || '',
        tracklist: order.tracklist || '',
        socials: order.socials || ''
      }
    });
    await setStore('mixtape_orders', orders);

    return json(200, { ok: true, storage: 'local_dev', order: orders[0] });
  } catch (e) {
    return json(500, { ok: false, error: 'submit_failed', message: String(e?.message || e) });
  }
}
