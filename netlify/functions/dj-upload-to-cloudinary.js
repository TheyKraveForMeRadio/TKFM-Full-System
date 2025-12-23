// netlify/functions/dj-upload-to-cloudinary.js — ENTERPRISE LOCKED
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
  // guard against huge JSON payloads in Functions
  if (body.length > 2_500_000) return 'TOO_LARGE' // ~2.5MB string
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

function isAllowedDataUrl(s) {
  // Accept ONLY data URLs for audio uploads:
  // data:audio/mpeg;base64,....
  // data:audio/wav;base64,....
  if (typeof s !== 'string') return false
  if (!s.startsWith('data:audio/')) return false
  if (!s.includes(';base64,')) return false
  return true
}

function pickAudioFormat(dataUrl) {
  // basic mapping from mime -> format for Cloudinary
  // data:audio/mpeg;base64,...
  const header = dataUrl.slice(0, 60).toLowerCase()
  if (header.includes('audio/mpeg')) return 'mp3'
  if (header.includes('audio/mp3')) return 'mp3'
  if (header.includes('audio/wav')) return 'wav'
  if (header.includes('audio/x-wav')) return 'wav'
  if (header.includes('audio/ogg')) return 'ogg'
  if (header.includes('audio/webm')) return 'webm'
  return null
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  try {
    // ✅ auth first
    const decoded = requireDJ(event)

    // ✅ cloudinary config lock
    const cn = process.env.CLOUDINARY_CLOUD_NAME
    const ck = process.env.CLOUDINARY_API_KEY
    const cs = process.env.CLOUDINARY_API_SECRET
    if (!cn || !ck || !cs) return json(500, { error: 'Cloudinary not configured' })

    cloudinary.config({ cloud_name: cn, api_key: ck, api_secret: cs })

    // ✅ parse + size guard
    const payload = safeParse(event.body)
    if (payload === 'TOO_LARGE') return json(413, { error: 'Payload too large' })
    if (!payload) return json(400, { error: 'Invalid JSON' })

    const file = payload.file
    if (!isAllowedDataUrl(file)) return json(400, { error: 'Invalid file (must be audio data URL)' })

    const format = pickAudioFormat(file)
    if (!format) return json(400, { error: 'Unsupported audio type' })

    // ✅ enterprise naming
    const ts = Date.now()
    const safeEmail = String(decoded.email || 'dj').replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)
    const publicId = `tkfm-${safeEmail}-${ts}`

    // ✅ Cloudinary upload with constraints
    const upload = await cloudinary.uploader.upload(file, {
      resource_type: 'video',          // Cloudinary uses "video" for audio files too
      folder: 'tkfm/mixtapes',
      public_id: publicId,
      overwrite: false,
      unique_filename: true,
      use_filename: false,

      // restrict output format
      format,

      // security/quality controls
      invalidate: true,
    })

    return json(200, { ok: true, url: upload.secure_url, publicId: upload.public_id })
  } catch (err) {
    const status = err.statusCode || 500
    return json(status, { error: err.message || 'Upload failed' })
  }
}
