/**
 * TKFM Core Helpers
 * Shared data brain for:
 * - artistUploads
 * - tkfm_catalog
 * - tkfm_autopilot_last_pack
 * - mixtapeOrders
 * - tkfm_contract_latest
 *
 * All front-end pages can import from here:
 *   import {
 *     getArtistUploads, setArtistUploads,
 *     getCatalog, setCatalog,
 *     promoteArtistUploadToCatalog,
 *     getAutopilotPack, setAutopilotPack,
 *     generateAutopilotPack,
 *     getMixtapeOrders, setMixtapeOrders, updateMixtapeStatus,
 *     getLatestContract, setLatestContract,
 *     getRotationForAIDJ
 *   } from './js/tkfm-core.js'
 */

const KEYS = {
  ARTIST_UPLOADS: 'artistUploads',
  CATALOG: 'tkfm_catalog',
  AUTOPILOT_PACK: 'tkfm_autopilot_last_pack',
  MIXTAPE_ORDERS: 'mixtapeOrders',
  CONTRACT_LATEST: 'tkfm_contract_latest'
};

// ---------- generic storage helpers ----------

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (e) {
    console.error('[TKFM] readJSON error for key:', key, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[TKFM] writeJSON error for key:', key, e);
  }
}

// expose generic
export function readKey(key, fallback = null) {
  return readJSON(key, fallback);
}
export function writeKey(key, value) {
  writeJSON(key, value);
}

// ---------- artist uploads ----------

export function getArtistUploads() {
  const arr = readJSON(KEYS.ARTIST_UPLOADS, []);
  return Array.isArray(arr) ? arr : [];
}

export function setArtistUploads(list) {
  writeJSON(KEYS.ARTIST_UPLOADS, Array.isArray(list) ? list : []);
}

function normalizeUpload(u) {
  return {
    id: u.id || u.uploadId || u.trackId || (u.artistName || u.artist || 'artist') + '::' + (u.trackTitle || u.title || 'title'),
    artistName: u.artistName || u.artist || u.name || 'Unknown Artist',
    trackTitle: u.trackTitle || u.title || u.songTitle || 'Untitled',
    status: (u.status || 'pending').toLowerCase(),
    tier: u.tier || 'standard',
    featured: !!u.featured,
    elite: !!u.elite,
    ...u
  };
}

function normalizeCatalogEntry(c) {
  return {
    id: c.id || c.uploadId || c.trackId || (c.artistName || 'artist') + '::' + (c.trackTitle || 'title'),
    artistName: c.artistName || c.artist || 'Unknown Artist',
    trackTitle: c.trackTitle || c.title || 'Untitled',
    tier: c.tier || 'standard',
    featured: !!c.featured,
    elite: !!c.elite,
    source: c.source || 'artistUploads',
    ...c
  };
}

// ---------- catalog ----------

export function getCatalog() {
  const arr = readJSON(KEYS.CATALOG, []);
  return Array.isArray(arr) ? arr : [];
}

export function setCatalog(list) {
  writeJSON(KEYS.CATALOG, Array.isArray(list) ? list : []);
}

/**
 * Promote a single upload into catalog + update its status.
 * Returns { upload, catalogEntry } or null.
 */
export function promoteArtistUploadToCatalog(uploadId, extra = {}) {
  const uploads = getArtistUploads().map(normalizeUpload);
  const idx = uploads.findIndex(u => String(u.id) === String(uploadId));
  if (idx === -1) return null;

  uploads[idx] = {
    ...uploads[idx],
    status: 'cataloged',
    ...extra
  };
  setArtistUploads(uploads);

  const catalog = getCatalog().map(normalizeCatalogEntry);
  const base = uploads[idx];

  const payload = normalizeCatalogEntry({
    id: base.id,
    artistName: base.artistName,
    trackTitle: base.trackTitle,
    tier: base.tier,
    featured: base.featured,
    elite: base.elite,
    ...extra
  });

  const cIdx = catalog.findIndex(c => String(c.id) === String(payload.id));
  if (cIdx === -1) catalog.push(payload);
  else catalog[cIdx] = { ...catalog[cIdx], ...payload };

  setCatalog(catalog);

  return { upload: uploads[idx], catalogEntry: payload };
}

/**
 * Mirror flags / tier from uploads into catalog.
 */
export function syncCatalogFromUploads() {
  const uploads = getArtistUploads().map(normalizeUpload);
  const catalog = getCatalog().map(normalizeCatalogEntry);
  const map = new Map();

  catalog.forEach(c => map.set(String(c.id), c));

  uploads.forEach(u => {
    if (u.status !== 'cataloged') return;
    const id = String(u.id);
    const existing = map.get(id);
    const payload = normalizeCatalogEntry({
      id: u.id,
      artistName: u.artistName,
      trackTitle: u.trackTitle,
      tier: u.tier,
      featured: u.featured,
      elite: u.elite
    });
    map.set(id, existing ? { ...existing, ...payload } : payload);
  });

  const merged = Array.from(map.values());
  setCatalog(merged);
  return merged;
}

// ---------- autopilot pack ----------

export function getAutopilotPack() {
  const raw = readJSON(KEYS.AUTOPILOT_PACK, []);
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.tracks)) return raw.tracks;
  return [];
}

export function setAutopilotPack(listOrObj) {
  // allow either pure array or { tracks, meta }
  if (Array.isArray(listOrObj)) {
    writeJSON(KEYS.AUTOPILOT_PACK, listOrObj);
  } else {
    writeJSON(KEYS.AUTOPILOT_PACK, listOrObj || []);
  }
}

/**
 * Simple weighted pack generator.
 * - base weight: 1 (standard)
 * - featured boost: +1
 * - elite boost: +2
 * Tier multiplier:
 *   - standard: x1
 *   - priority: x1.4
 *   - elite: x2
 */
export function generateAutopilotPack(options = {}) {
  const {
    maxTracks = 40,
    featuredBoost = 1,
    eliteBoost = 2
  } = options;

  const catalog = getCatalog().map(normalizeCatalogEntry);
  if (!catalog.length) {
    setAutopilotPack([]);
    return [];
  }

  const weighted = [];

  catalog.forEach(track => {
    let weight = 1;
    if (track.featured) weight += featuredBoost;
    if (track.elite) weight += eliteBoost;

    const tier = (track.tier || 'standard').toLowerCase();
    if (tier === 'priority') weight *= 1.4;
    if (tier === 'elite') weight *= 2;

    const copies = Math.max(1, Math.round(weight));
    for (let i = 0; i < copies; i++) {
      weighted.push(track);
    }
  });

  // shuffle
  for (let i = weighted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weighted[i], weighted[j]] = [weighted[j], weighted[i]];
  }

  const pack = weighted.slice(0, maxTracks);
  setAutopilotPack(pack);
  return pack;
}

/**
 * Alias specifically for AI DJ engine.
 */
export function getRotationForAIDJ() {
  return getAutopilotPack();
}

// ---------- mixtape orders ----------

export function getMixtapeOrders() {
  const arr = readJSON(KEYS.MIXTAPE_ORDERS, []);
  return Array.isArray(arr) ? arr : [];
}

export function setMixtapeOrders(list) {
  writeJSON(KEYS.MIXTAPE_ORDERS, Array.isArray(list) ? list : []);
}

export function updateMixtapeStatus(orderId, status) {
  const list = getMixtapeOrders();
  const idx = list.findIndex(o => String(o.id) === String(orderId));
  if (idx === -1) return null;
  list[idx] = { ...list[idx], status };
  setMixtapeOrders(list);
  return list[idx];
}

// ---------- contract latest ----------

export function getLatestContract() {
  const obj = readJSON(KEYS.CONTRACT_LATEST, null);
  return obj && typeof obj === 'object' ? obj : null;
}

export function setLatestContract(contractObj) {
  writeJSON(KEYS.CONTRACT_LATEST, contractObj || null);
}
