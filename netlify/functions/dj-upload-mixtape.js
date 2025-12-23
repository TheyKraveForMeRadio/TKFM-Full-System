// netlify/functions/dj-upload-mixtape.js — ENTERPRISE LOCKED (tightened)
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { getStore, setStore } from './_helpers.js'

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  }
}

function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}

function safeString(v, min, max) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  if (s.length < min) return ''
  return s.length > max ? s.slice(0, max) : s
}

function safeUrl(v) {
  if (v == null) return null
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s || s.length > 800) return null
  try {
    const u = new URL(s)
    if (u.protocol !== 'https:' && u.hostname !== 'localhost') return null
    return u.toString()
  } catch {
    return null
  }
}

function isAllowedAudioHost(urlStr) {
  try {
    const u = new URL(urlStr)
    // Allow Cloudinary by default
    if (u.hostname.endsWith('cloudinary.com')) return true

    // Optional: allow your own domain/CDN
    const extra = String(process.env.ALLOWED_AUDIO_HOSTS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)

    return extra.includes(u.hostname.toLowerCase())
  } catch {
    return false
  }
}

function getIP(event) {
  const h = event.headers || {}
  const ip =
    h['x-nf-client-connection-ip'] ||
    (typeof h['x-forwarded-for'] === 'string' ? h['x-forwarded-for'].split(',')[0].trim() : '') ||
    ''
  return ip || 'unknown'
}

async function throttle(ipOrUserKey) {
  // 30 writes / 10 minutes
  const store = (await getStore('rate_limits')) || {}
  const now = Date.now()
  const windowMs = 10 * 60 * 1000
  const max = 30

  const key = `dj_upload_${ipOrUserKey}`
  const entry = store[key] || { count: 0, resetAt: now + windowMs }
  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + windowMs
  }
  entry.count += 1
  store[key] = entry

  // hygiene cap
  const keys = Object.keys(store)
  if (keys.length > 5000) {
    keys
      .sort((a, b) => (store[a]?.resetAt || 0) - (store[b]?.resetAt || 0))
      .slice(0, 1000)
      .forEach(k => delete store[k])
  }

  await setStore('rate_limits', store)

  if (entry.count > max) {
    const err = new Error('Rate limited')
    err.statusCode = 429
    throw err
  }
}

function requireDJ(event) {
  const SECRET = process.env.DJ_JWT_SECRET
  if (!SECRET) {
    const err = new Error('Server not configured')
    err.statusCode = 500
    throw err
  }

  const token = getBearer(event)
  if (!token) {
    const err = new Error('Unauthorized')
    err.statusCode = 401
    throw err
  }

  let decoded
  try {
    decoded = jwt.verify(token, SECRET, { issuer: 'tkfm', audience: 'tkfm-dj' })
  } catch {
    const err = new Error('Invalid or expired token')
    err.statusCode = 401
    throw err
  }

  if (!decoded || decoded.role !== 'dj') {
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }

  return decoded
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  try {
    const decoded = requireDJ(event)
    const ip = getIP(event)
    await throttle(decoded.email || ip)

    const ct = (event.headers?.['content-type'] || event.headers?.['Content-Type'] || '').toLowerCase()

    // JSON mode only (recommended)
    if (ct.includes('application/json') || !ct) {
      const payload = (() => { try { return JSON.parse(event.body || '{}') } catch { return null } })()
      if (!payload) return json(400, { error: 'Invalid JSON' })

      const title = safeString(payload.title, 2, 120)
      const djName = safeString(payload.djName, 2, 60) || safeString(decoded.email, 3, 80)
      const audioUrl = safeUrl(payload.audioUrl)
      const coverUrl = safeUrl(payload.coverUrl)

      if (!title) return json(400, { error: 'Missing title' })
      if (!audioUrl) return json(400, { error: 'Missing audioUrl' })

      if (!isAllowedAudioHost(audioUrl)) {
        return json(400, { error: 'audioUrl host not allowed' })
      }

      const store = (await getStore('mixtapes')) || []

      const mixtape = {
        id: uuidv4(),
        title,
        djName,
        audioUrl,
        coverUrl: coverUrl || null,
        createdAt: Date.now(),

        featured: false,
        featureTier: null,
        featureExpiresAt: null,
        featuredViews: 0,
        homepagePin: false,

        uploadedBy: decoded.email || null,
        uploadSource: 'dj-json-cloudinary',
      }

      store.unshift(mixtape)
      await setStore('mixtapes', store)

      return json(200, { ok: true, mixtapeId: mixtape.id })
    }

    return json(415, { error: 'Unsupported Media Type (use application/json)' })
  } catch (err) {
    return json(err.statusCode || 500, { error: err.message || 'Internal Error' })
  }
}
