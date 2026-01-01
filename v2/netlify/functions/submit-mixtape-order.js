import { getStore, setStore, json } from './_helpers.js';

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

    const orders = await getStore('mixtape_orders', []);
    const order = {
      id: id(),
      createdAt: nowIso(),
      status: 'new',
      tier: String(body.tier || '').trim(),
      artistName: String(body.artistName || '').trim(),
      email: String(body.email || '').trim(),
      phone: String(body.phone || '').trim(),
      mixtapeTitle: String(body.mixtapeTitle || '').trim(),
      notes: String(body.notes || '').trim(),
      links: {
        download: String(body.download || '').trim(),
        tracklist: String(body.tracklist || '').trim(),
        socials: String(body.socials || '').trim()
      }
    };

    orders.unshift(order);
    await setStore('mixtape_orders', orders);

    return json(200, { ok: true, order });
  } catch (e) {
    return json(500, { ok: false, error: 'submit_failed', message: String(e?.message || e) });
  }
}
