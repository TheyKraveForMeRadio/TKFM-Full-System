// netlify/functions/dj-upload-mixtape.js — ENTERPRISE LOCKED
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

function requireDJ(event) {
  const SECRET = process.env.DJ_JWT_SECRET
  if (!SECRET) throw new Error('Server not configured')

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
    // ✅ DJ AUTH
    const decoded = requireDJ(event)

    // =========================================
    // ENTERPRISE NOTE:
    // Netlify Functions are NOT designed for 200MB multipart uploads.
    // We support:
    //   A) JSON mode (recommended): title,djName,audioUrl,coverUrl
    //   B) Multipart mode (small only): rejected with 413 if too large
    // =========================================

    const ct = (event.headers?.['content-type'] || event.headers?.['Content-Type'] || '').toLowerCase()

    // ---- A) JSON mode (recommended) ----
    if (ct.includes('application/json') || !ct) {
      const payload = (() => { try { return JSON.parse(event.body || '{}') } catch { return null } })()
      if (!payload) return json(400, { error: 'Invalid JSON' })

      const title = safeString(payload.title, 2, 120)
      const djName = safeString(payload.djName, 2, 60) || safeString(decoded.email, 3, 80)
      const audioUrl = safeUrl(payload.audioUrl)
      const coverUrl = safeUrl(payload.coverUrl)

      if (!title) return json(400, { error: 'Missing title' })
      if (!audioUrl) return json(400, { error: 'Missing audioUrl (upload audio to storage, then send URL)' })

      const store = (await getStore('mixtapes')) || []

      const mixtape = {
        id: uuidv4(),
        title,
        djName,
        audioUrl,
        coverUrl: coverUrl || null,
        createdAt: Date.now(),

        // monetization fields
        featured: false,
        featureTier: null,
        featureExpiresAt: null,
        featuredViews: 0,
        homepagePin: false,

        // audit fields
        uploadedBy: decoded.email || null,
        uploadSource: 'dj-json',
      }

      store.unshift(mixtape)
      await setStore('mixtapes', store)

      return json(200, { ok: true, mixtapeId: mixtape.id })
    }

    // ---- B) Multipart mode (small only) ----
    // Netlify will base64 encode and size-limit bodies; large uploads will fail upstream.
    // We fail fast to avoid false “success”.
    return json(413, {
      error: 'Multipart uploads are not supported for large files on Netlify Functions.',
      fix: 'Upload audio to storage (Supabase Storage/S3) directly, then call this endpoint with JSON {title,djName,audioUrl,coverUrl}.',
    })
  } catch (err) {
    const statusCode = err.statusCode || 500
    return json(statusCode, { error: err.message || 'Internal Error' })
  }
}
