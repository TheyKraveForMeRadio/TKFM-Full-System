import { getStore, setStore } from './_helpers.js';

function json(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(data)
  };
}

function getOwnerKey(event) {
  const h = event.headers || {};
  const fromHeader =
    h['x-tkfm-owner-key'] ||
    h['X-TKFM-OWNER-KEY'] ||
    h['x-tkfm-owner_key'] ||
    h['X-TKFM-OWNER_KEY'] ||
    '';
  const qs = event.queryStringParameters || {};
  const fromQuery = qs.owner_key || qs.ownerKey || '';
  return String(fromHeader || fromQuery || '').trim();
}

function safeStr(v, max = 4000) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

    const provided = getOwnerKey(event);
    const expected = (process.env.TKFM_OWNER_KEY || '').trim();

    if (!expected) return json(500, { ok: false, error: 'Owner key not configured' });
    if (!provided || provided !== expected) return json(401, { ok: false, error: 'Unauthorized' });

    const body = event.body ? JSON.parse(event.body) : {};
    const id = safeStr(body.id, 200);
    const status = safeStr(body.status, 40);
    const featuredTitle = safeStr(body.featuredTitle, 160);
    const featuredUrl = safeStr(body.featuredUrl, 1000);
    const featuredKind = safeStr(body.featuredKind, 40) || 'link';

    if (!id) return json(400, { ok: false, error: 'Missing id' });
    if (!status) return json(400, { ok: false, error: 'Missing status' });

    const storeKey = 'paid_lane_submissions';
    const list = (await getStore(storeKey)) || [];
    const idx = list.findIndex(x => String(x.id) === id);
    if (idx === -1) return json(404, { ok: false, error: 'Not found' });

    const now = new Date().toISOString();
    list[idx].status = status;
    list[idx].updatedAt = now;

    await setStore(storeKey, list);

    // Optional: promote to featured_media store (non-breaking if not used elsewhere)
    if (status === 'approved' && featuredUrl) {
      const fmKey = 'featured_media';
      const fm = (await getStore(fmKey)) || [];
      fm.unshift({
        id: `fm_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        title: featuredTitle || (list[idx].name ? `Featured: ${list[idx].name}` : 'Featured'),
        url: featuredUrl,
        kind: featuredKind,
        addedAt: now,
        source: 'paid_lane_inbox',
        submissionId: id
      });
      await setStore(fmKey, fm.slice(0, 60));
    }

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
