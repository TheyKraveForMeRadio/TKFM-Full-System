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

function safeStr(v, max = 4000) {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return json(405, { ok: false, error: 'Method not allowed' });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const laneId = safeStr(body.laneId, 120);
    const planId = safeStr(body.planId, 120);
    const name = safeStr(body.name, 120);
    const email = safeStr(body.email, 200);
    const links = safeStr(body.links, 2000);
    const notes = safeStr(body.notes, 6000);

    if (!laneId && !planId) return json(400, { ok: false, error: 'Missing laneId/planId' });
    if (!name && !email) return json(400, { ok: false, error: 'Missing name/email' });

    const id = `pls_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const createdAt = new Date().toISOString();

    const entry = {
      id,
      laneId: laneId || planId,
      planId,
      name,
      email,
      links,
      notes,
      status: 'new',
      createdAt,
      updatedAt: createdAt
    };

    const storeKey = 'paid_lane_submissions';
    const existing = (await getStore(storeKey)) || [];
    existing.push(entry);
    await setStore(storeKey, existing);

    return json(200, { ok: true, id });
  } catch (e) {
    return json(500, { ok: false, error: 'Server error' });
  }
}
