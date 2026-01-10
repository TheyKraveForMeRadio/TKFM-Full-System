import { getStore } from './_helpers.js'

/**
 * PUBLIC: Returns featured media items for TV / Podcast / Video / Press lanes.
 *
 * Query params:
 *   - type: (optional) filter by item.type (e.g. podcast|video|press|artist|tv)
 *   - limit: (optional) max items returned (default 50, max 200)
 *   - shuffle: (optional) "1" to shuffle results AFTER filtering (useful for rotators)
 *   - activeOnly: (optional) "1" to hide disabled + expired (default 1)
 *
 * Store key fallback:
 *   - media_features (preferred)
 *   - featured_media
 *   - mediaFeatured
 */
function safeJsonParse(s, fallback = null) {
  try { return JSON.parse(s) } catch { return fallback }
}

function nowIso() {
  return new Date().toISOString()
}

function isExpired(item, nowMs) {
  const exp = item?.expiresAt || item?.expires_at || item?.expiry || null
  if (!exp) return false
  const t = Date.parse(exp)
  if (!Number.isFinite(t)) return false
  return t <= nowMs
}

function normalizeType(t) {
  if (!t) return ''
  return String(t).trim().toLowerCase()
}

function getBool(v, def = false) {
  if (v === null || v === undefined || v === '') return def
  const s = String(v).toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'y'
}

function clampInt(v, def, min, max) {
  const n = parseInt(v ?? '', 10)
  if (!Number.isFinite(n)) return def
  return Math.max(min, Math.min(max, n))
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function sortFeatured(arr) {
  // Rank desc, then updatedAt desc, then createdAt desc
  return arr.sort((a, b) => {
    const ra = Number(a?.rank ?? a?.priority ?? 0)
    const rb = Number(b?.rank ?? b?.priority ?? 0)
    if (rb !== ra) return rb - ra

    const ua = Date.parse(a?.updatedAt || a?.updated_at || a?.modifiedAt || '')
    const ub = Date.parse(b?.updatedAt || b?.updated_at || b?.modifiedAt || '')
    if (Number.isFinite(ub) && Number.isFinite(ua) && ub !== ua) return ub - ua
    if (Number.isFinite(ub) && !Number.isFinite(ua)) return -1
    if (!Number.isFinite(ub) && Number.isFinite(ua)) return 1

    const ca = Date.parse(a?.createdAt || a?.created_at || '')
    const cb = Date.parse(b?.createdAt || b?.created_at || '')
    if (Number.isFinite(cb) && Number.isFinite(ca) && cb !== ca) return cb - ca
    if (Number.isFinite(cb) && !Number.isFinite(ca)) return -1
    if (!Number.isFinite(cb) && Number.isFinite(ca)) return 1
    return 0
  })
}

async function loadStore() {
  const featuredKey = process.env.TKFM_MEDIA_FEATURE_STORE_KEY || 'media_featured';
const a = await getStore(featuredKey)
  if (Array.isArray(a)) return a

  const b = await getStore('featured_media')
  if (Array.isArray(b)) return b

  const c = await getStore('mediaFeatured')
  if (Array.isArray(c)) return c

  return []
}

export async function handler(event) {
  const url = new URL(event.rawUrl || ('https://example.com' + (event.path || '/')))
  const type = normalizeType(url.searchParams.get('type'))
  const limit = clampInt(url.searchParams.get('limit'), 50, 1, 200)
  const shuffle = getBool(url.searchParams.get('shuffle'), false)
  const activeOnly = getBool(url.searchParams.get('activeOnly'), true)

  const nowMs = Date.now()
  let items = await loadStore()

  // Normalize to objects
  items = (items || []).map((x) => {
    if (typeof x === 'string') return safeJsonParse(x, { url: x })
    return x || {}
  })

  if (activeOnly) {
    items = items.filter((it) => {
      if (it?.disabled === true) return false
      if (it?.active === false) return false
      if (isExpired(it, nowMs)) return false
      return true
    })
  }

  if (type) {
    items = items.filter((it) => normalizeType(it?.type) === type)
  }

  items = sortFeatured(items)

  if (shuffle) {
    shuffleInPlace(items)
  }

  items = items.slice(0, limit)

  const payload = {
    ok: true,
    now: nowIso(),
    count: items.length,
    type: type || null,
    items
  }

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Keep fresh for rotators:
      'cache-control': 'no-store, max-age=0',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type'
    },
    body: JSON.stringify(payload)
  }
}
