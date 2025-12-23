import {
  getStore,
  setStore,
  handleOptions,
  json,
  badRequest,
  forbidden,
} from './_helpers.js'

function getOrigin(event) {
  return event?.headers?.origin || event?.headers?.Origin || ''
}

function getReferer(event) {
  return event?.headers?.referer || event?.headers?.Referer || ''
}

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function isFromAllowedSource(origin, referer) {
  const allowed = allowedOrigins()
  if (!allowed.length) return false // lock default: deny if not configured

  // Primary: strict Origin match (browser calls)
  if (origin && allowed.includes(origin)) return true

  // Fallback: Referer prefix match (some clients)
  if (referer) return allowed.some(a => referer.startsWith(a))

  return false
}

export async function handler(event) {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return handleOptions(event)

  const origin = getOrigin(event)
  const referer = getReferer(event)

  // Method lock
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' }, { origin })
  }

  // Source gate (cuts off most abuse)
  if (!isFromAllowedSource(origin, referer)) {
    return forbidden('Forbidden', origin)
  }

  // Safe parse
  let payload
  try {
    payload = event.body ? JSON.parse(event.body) : null
  } catch {
    return badRequest('Invalid JSON', origin)
  }

  // Validate inputs
  const type = payload?.type
  const id = payload?.id

  if (type !== 'sponsor' && type !== 'mixtape') {
    return badRequest('Invalid type', origin)
  }

  if (typeof id !== 'string' || id.length < 3 || id.length > 128) {
    return badRequest('Invalid id', origin)
  }

  const storeName = type === 'sponsor' ? 'sponsors' : 'mixtapes'

  // Defensive store
  const store = (await getStore(storeName)) || []
  if (!Array.isArray(store)) {
    return json(500, { error: 'Store shape invalid' }, { origin })
  }

  // Update if exists (no leakage)
  const item = store.find(x => x && x.id === id)
  if (item) {
    item.impressions = (item.impressions || 0) + 1
    item.lastSeenAt = Date.now()
    await setStore(storeName, store)
  }

  return json(200, { ok: true }, { origin })
}
