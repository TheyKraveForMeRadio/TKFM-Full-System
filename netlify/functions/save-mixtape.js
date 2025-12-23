import { v4 as uuidv4 } from 'uuid'
import { getStore, setStore } from './_helpers.js'

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  }
}

function safeParse(body) {
  if (!body || typeof body !== 'string') return null
  if (body.length > 200_000) return null
  try { return JSON.parse(body) } catch { return null }
}

function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : h.trim()
}

function safeString(x, min = 1, max = 120) {
  if (typeof x !== 'string') return ''
  const s = x.trim()
  if (s.length < min) return ''
  return s.length > max ? s.slice(0, max) : s
}

function safeURL(url) {
  if (typeof url !== 'string') return ''
  try {
    const u = new URL(url)
    // Require https in prod (allow localhost for dev)
    if (u.protocol !== 'https:' && u.hostname !== 'localhost') return ''
    return u.toString()
  } catch {
    return ''
  }
}

export async function handler(event) {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' })
  }

  // Auth gate (DJ token required)
  if (String(process.env.REQUIRE_DJ_AUTH || '').toLowerCase() === 'true') {
    const token = getBearer(event)
    if (!token) return json(401, { error: 'Unauthorized' })
    // Token verification can be centralized later in _helpers.js
  }

  const body = safeParse(event.body)
  if (!body) return json(400, { error: 'Invalid JSON' })

  const title = safeString(body.title, 3, 120)
  const djName = safeString(body.djName, 2, 80)
  const audioUrl = safeURL(body.audioUrl)

  if (!title || !djName || !audioUrl) {
    return json(400, { error: 'Invalid input' })
  }

  const store = (await getStore('mixtapes')) || []
  if (!Array.isArray(store)) {
    return json(500, { error: 'Store shape invalid' })
  }

  const mixtape = {
    id: uuidv4(),
    title,
    djName,
    audioUrl,
    createdAt: Date.now(),

    featured: false,
    featureTier: null,
    featureExpiresAt: null,
    featuredViews: 0,
    homepagePin: false,
  }

  store.unshift(mixtape)
  await setStore('mixtapes', store)

  return json(200, { ok: true, id: mixtape.id })
}
