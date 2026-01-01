import { getStore, setStore, json } from './_helpers.js';
import { supabaseEnabled, sbInsert } from './_supabase_rest.js';
import { sendEmail } from './_sendgrid.js';

function nowIso() { return new Date().toISOString(); }
function id() { return 'mix_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16); }

function esc(s){ return String(s||'').replace(/[&<>"]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m])); }

function formatOwnerEmail(order) {
  const download = order.download || order.links?.download || '';
  const tracklist = order.tracklist || order.links?.tracklist || '';
  const socials = order.socials || order.links?.socials || '';
  const notes = order.notes || '';

  const subject = `TKFM Mixtape Order (${order.tier}) — ${order.mixtape_title || order.mixtapeTitle}`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.45">
    <h2>New Mixtape Hosting Order</h2>
    <p><b>Tier:</b> ${esc(order.tier)}</p>
    <p><b>Artist:</b> ${esc(order.artist_name || order.artistName)}</p>
    <p><b>Email:</b> ${esc(order.email)}</p>
    ${order.phone || order.phone === '' ? `<p><b>Phone:</b> ${esc(order.phone || '')}</p>` : ''}
    <p><b>Mixtape:</b> ${esc(order.mixtape_title || order.mixtapeTitle)}</p>
    <p><b>Download:</b> ${download ? `<a href="${esc(download)}">${esc(download)}</a>` : '—'}</p>
    <p><b>Tracklist:</b> ${tracklist ? `<a href="${esc(tracklist)}">${esc(tracklist)}</a>` : '—'}</p>
    <p><b>Socials:</b> ${esc(socials || '—')}</p>
    <p><b>Notes:</b><br/>${esc(notes || '—').replace(/\n/g,'<br/>')}</p>
    <hr/>
    <p><b>Order ID:</b> ${esc(order.id)}</p>
    <p><b>Created:</b> ${esc(order.created_at || order.createdAt)}</p>
  </div>`;

  const text =
`New Mixtape Hosting Order
Tier: ${order.tier}
Artist: ${order.artist_name || order.artistName}
Email: ${order.email}
Phone: ${order.phone || ''}
Mixtape: ${order.mixtape_title || order.mixtapeTitle}
Download: ${download || '—'}
Tracklist: ${tracklist || '—'}
Socials: ${socials || '—'}
Notes: ${notes || '—'}
Order ID: ${order.id}
Created: ${order.created_at || order.createdAt}
`;

  return { subject, html, text };
}

function formatArtistEmail(order) {
  const subject = `TKFM — Mixtape Order Received (${order.tier})`;
  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.45">
    <h2>✅ We got your Mixtape Order</h2>
    <p>Your submission is locked in. DJ Krave will review and follow up.</p>
    <p><b>Tier:</b> ${esc(order.tier)}</p>
    <p><b>Mixtape:</b> ${esc(order.mixtape_title || order.mixtapeTitle)}</p>
    <p><b>Order ID:</b> ${esc(order.id)}</p>
    <p style="opacity:.8">If you need to update links/notes, reply to this email and include your Order ID.</p>
  </div>`;
  const text =
`We got your Mixtape Order.
Tier: ${order.tier}
Mixtape: ${order.mixtape_title || order.mixtapeTitle}
Order ID: ${order.id}
`;
  return { subject, html, text };
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

    const body = event.body ? JSON.parse(event.body) : {};
    const required = ['tier', 'artistName', 'email', 'mixtapeTitle'];
    for (const k of required) {
      if (!String(body[k] || '').trim()) return json(400, { ok: false, error: 'missing_field', field: k });
    }

    // Build canonical order (Supabase shape)
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

    let saved = null;
    let storage = 'local_dev';

    if (supabaseEnabled()) {
      saved = await sbInsert('mixtape_orders', order);
      storage = 'supabase';
    } else {
      // Local dev store (legacy shape kept for compatibility)
      const orders = await getStore('mixtape_orders', []);
      const legacy = {
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
      };
      orders.unshift(legacy);
      await setStore('mixtape_orders', orders);
      saved = legacy;
    }

    // Email notifications (optional but powerful)
    const ownerEmail = String(process.env.OWNER_EMAIL || '').trim();
    const canEmail = String(process.env.SENDGRID_API_KEY || '').trim() && String(process.env.SENDGRID_FROM_EMAIL || '').trim();

    if (ownerEmail && canEmail) {
      const o = (storage === 'supabase') ? saved : {
        id: saved.id,
        createdAt: saved.createdAt,
        tier: saved.tier,
        email: saved.email,
        phone: saved.phone,
        artistName: saved.artistName,
        mixtapeTitle: saved.mixtapeTitle,
        links: saved.links,
        notes: saved.notes
      };

      const ownerMsg = formatOwnerEmail(o);
      await sendEmail({ to: ownerEmail, subject: ownerMsg.subject, html: ownerMsg.html, text: ownerMsg.text });

      // Artist confirmation (best UX)
      const artistMsg = formatArtistEmail(o);
      await sendEmail({ to: String(o.email || '').trim(), subject: artistMsg.subject, html: artistMsg.html, text: artistMsg.text });
    }

    return json(200, { ok: true, storage, order: saved, emailed: !!(String(process.env.OWNER_EMAIL || '').trim() && String(process.env.SENDGRID_API_KEY || '').trim()) });
  } catch (e) {
    return json(500, { ok: false, error: 'submit_failed', message: String(e?.message || e) });
  }
}
