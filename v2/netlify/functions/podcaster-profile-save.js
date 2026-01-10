import { getStore, setStore } from './_helpers.js';
import { requireActivePlansByEmail } from './_entitlement.js';

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

// REQUIRED monthly access for podcaster tools
const REQUIRED_PLANS = ['video_creator_pass_monthly'];

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok:false, error:'Method not allowed' });

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch (e) {}

  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) return json(403, { ok:false, error:'Missing email' });

  // SERVER GATE
  try {
    const gate = await requireActivePlansByEmail(email, REQUIRED_PLANS);
    if (!gate.ok) return json(403, { ok:false, error: gate.error || 'Subscription check failed' });
    if (!gate.hasAny) return json(403, { ok:false, error:'No active monthly subscription found.' });
  } catch (e) {
    return json(502, { ok:false, error:'Could not verify subscription right now.' });
  }

  const showName = String(payload.showName || '').trim();
  const hostName = String(payload.hostName || '').trim();
  const category = String(payload.category || '').trim();
  const bio = String(payload.bio || '').trim();
  const coverUrl = String(payload.coverUrl || '').trim();
  const website = String(payload.website || '').trim();
  const youtube = String(payload.youtube || '').trim();
  const spotify = String(payload.spotify || '').trim();

  if (!showName || !hostName) return json(400, { ok:false, error:'Missing showName or hostName' });

  const slug = slugify(payload.slug || showName);
  if (!slug) return json(400, { ok:false, error:'Invalid slug' });

  const store = (await getStore('podcaster_profiles')) || [];
  const now = new Date().toISOString();

  const existingIdx = store.findIndex(x => x && x.slug === slug);
  const profile = {
    slug,
    showName,
    hostName,
    category,
    bio,
    coverUrl,
    website,
    youtube,
    spotify,
    updatedAt: now,
    createdAt: existingIdx >= 0 ? (store[existingIdx].createdAt || now) : now
  };

  if (existingIdx >= 0) store[existingIdx] = profile;
  else store.unshift(profile);

  await setStore('podcaster_profiles', store);

  return json(200, { ok:true, slug, profile });
}
