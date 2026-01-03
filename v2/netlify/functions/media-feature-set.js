import { getStore, setStore } from './_helpers.js';
import { requireOwnerFromEvent } from './_owner.js';

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function cleanStr(v, max=240){
  const s = String(v || '').trim();
  return s.length > max ? s.slice(0, max) : s;
}

function cleanUrl(v){
  const s = String(v || '').trim();
  if (!s) return '';
  // allow relative or https
  if (s.startsWith('/')) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return s; // keep (owner input)
}

function cleanKind(v){
  const k = String(v || '').trim().toLowerCase();
  if (['podcast','video','press','artist'].includes(k)) return k;
  return 'video';
}

function toInt(v, d=0){
  const n = parseInt(String(v||''), 10);
  return Number.isFinite(n) ? n : d;
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok:false, error:'Method not allowed' });

  const gate = await requireOwnerFromEvent(event);
  if (!gate.ok) return json(gate.statusCode || 403, { ok:false, error: gate.error || 'Owner only' });

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch (e) {}

  const action = String(payload.action || 'upsert').toLowerCase(); // upsert|disable|delete
  const id = cleanStr(payload.id || '', 80) || ('feat_' + Math.random().toString(36).slice(2) + '_' + Date.now());

  const kind = cleanKind(payload.kind);
  const title = cleanStr(payload.title, 120);
  const subtitle = cleanStr(payload.subtitle, 220);
  const ctaText = cleanStr(payload.ctaText, 48) || 'Open';
  const ctaUrl = cleanUrl(payload.ctaUrl);
  const embedUrl = cleanUrl(payload.embedUrl);
  const thumbUrl = cleanUrl(payload.thumbUrl);
  const rank = toInt(payload.rank, 0);
  const until = cleanStr(payload.until, 64); // ISO string or blank

  const store = (await getStore('featured_media')) || [];
  const idx = store.findIndex(x => x && String(x.id||'') === id);

  if (action === 'delete') {
    const next = store.filter(x => x && String(x.id||'') !== id);
    await setStore('featured_media', next);
    return json(200, { ok:true, action, id });
  }

  if (action === 'disable') {
    if (idx < 0) return json(404, { ok:false, error:'Not found', id });
    store[idx] = { ...store[idx], enabled:false, updatedAt: new Date().toISOString() };
    await setStore('featured_media', store);
    return json(200, { ok:true, action, id, item: store[idx] });
  }

  // upsert
  const item = {
    id,
    kind,
    title,
    subtitle,
    ctaText,
    ctaUrl,
    embedUrl,
    thumbUrl,
    rank,
    until,
    enabled: payload.enabled === false ? false : true,
    createdAt: (idx >= 0 && store[idx].createdAt) ? store[idx].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (idx >= 0) store[idx] = item;
  else store.push(item);

  await setStore('featured_media', store);
  return json(200, { ok:true, action:'upsert', id, item });
}
