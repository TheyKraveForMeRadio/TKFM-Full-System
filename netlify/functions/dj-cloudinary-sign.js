// netlify/functions/dj-cloudinary-sign.js — ENTERPRISE LOCKED (Direct-to-Cloudinary)
import { v2 as cloudinary } from 'cloudinary'
import jwt from 'jsonwebtoken'

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

function safeParse(body) {
  if (!body || typeof body !== 'string') return null
  if (body.length > 20_000) return null
  try { return JSON.parse(body) } catch { return null }
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

function safeString(v, min, max) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  if (s.length < min) return ''
  return s.length > max ? s.slice(0, max) : s
}

function safeExtFromMime(mime) {
  const m = String(mime || '').toLowerCase()
  if (m.includes('audio/mpeg') || m.includes('audio/mp3')) return 'mp3'
  if (m.includes('audio/wav') || m.includes('audio/x-wav')) return 'wav'
  if (m.includes('audio/ogg')) return 'ogg'
  if (m.includes('audio/webm')) return 'webm'
  return ''
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  try {
    const decoded = requireDJ(event)

    const cn = process.env.CLOUDINARY_CLOUD_NAME
    const ck = process.env.CLOUDINARY_API_KEY
    const cs = process.env.CLOUDINARY_API_SECRET
    if (!cn || !ck || !cs) return json(500, { error: 'Cloudinary not configured' })

    cloudinary.config({ cloud_name: cn, api_key: ck, api_secret: cs })

    const payload = safeParse(event.body)
    if (!payload) return json(400, { error: 'Invalid JSON' })

    // Client sends minimal info to request a signature
    const originalName = safeString(payload.originalName, 1, 120)
    const mimeType = safeString(payload.mimeType, 3, 80)

    if (!originalName || !mimeType) return json(400, { error: 'Missing file metadata' })

    const ext = safeExtFromMime(mimeType)
    if (!ext) return json(400, { error: 'Unsupported audio type' })

    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'tkfm/mixtapes'

    // Short safe email tag
    const safeEmail = String(decoded.email || 'dj')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 40)

    const timestamp = Math.floor(Date.now() / 1000)
    const publicId = `tkfm-${safeEmail}-${timestamp}`

    // Params we allow the client to upload with (signed)
    // resource_type "video" is correct for audio on Cloudinary
    const paramsToSign = {
      folder,
      public_id: publicId,
      resource_type: 'video',
      timestamp,
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, cs)

    return json(200, {
      ok: true,
      cloudName: cn,
      apiKey: ck,
      timestamp,
      signature,
      folder,
      publicId,
      resourceType: 'video',
      // Optional: let client display allowed format
      formatHint: ext,
    })
  } catch (err) {
    const status = err.statusCode || 500
    return json(status, { error: err.message || 'Sign failed' })
  }
}
