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
  if (origin && allowed.includes(origin)) return true
  if (referer) return allowed.some(a => referer.startsWith(a))
  return false
}

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') return handleOptions(event)

  const origin = getOrigin(event)
  const referer = getReferer(event)

  // Method lock
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' }, { origin })
  }

  // Source gate (reduces abuse)
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

  const sponsorId = payload?.sponsorId
  if (typeof sponsorId !== 'string' || sponsorId.length < 3 || sponsorId.length > 128) {
    return badRequest('Invalid sponsorId', origin)
  }

  // Defensive store
  const sponsors = (await getStore('sponsors')) || []
  if (!Array.isArray(sponsors)) {
    return json(500, { error: 'Store shape invalid' }, { origin })
  }

  const s = sponsors.find(x => x && x.id === sponsorId)
  if (s) {
    s.views = (s.views || 0) + 1
    s.lastViewedAt = Date.now()
    await setStore('sponsors', sponsors)
  }

  return json(200, { ok: true }, { origin })
}
