import { getStore } from './_helpers.js';

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

export async function handler(event) {
  try {
    if (event.httpMethod !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

    const list = (await getStore('featured_media')) || [];
    const items = Array.isArray(list) ? list : [];

    const normalized = items.map((x) => ({
      id: x.id || '',
      title: x.title || x.name || 'Featured',
      url: x.url || x.link || '',
      kind: x.kind || 'link',
      addedAt: x.addedAt || x.createdAt || '',
      boostUntil: x.boostUntil || ''
    })).filter(x => x.url);

    return json(200, { ok: true, items: normalized, featured: normalized });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
