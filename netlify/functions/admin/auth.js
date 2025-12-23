// netlify/functions/admin-auth.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  }
}

function safeParse(body) {
  if (!body || typeof body !== 'string') return null
  if (body.length > 50_000) return null
  try { return JSON.parse(body) } catch { return null }
}

function normEmail(email) {
  if (typeof email !== 'string') return ''
  return email.trim().toLowerCase()
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
  const SECRET = process.env.ADMIN_JWT_SECRET

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SECRET) {
    return json(500, { error: 'Server not configured' })
  }

  const body = safeParse(event.body)
  if (!body) return json(400, { error: 'Invalid JSON' })

  const email = normEmail(body.email)
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return json(400, { error: 'Email and password required' })
  }

  const okEmail = safeEqual(email, normEmail(ADMIN_EMAIL))
  const okPass = safeEqual(password, ADMIN_PASSWORD)

  if (!okEmail || !okPass) {
    return json(401, { error: 'Invalid credentials' })
  }

  // FINAL LOCK: shorter TTL is safer; renew by logging in again
  const token = jwt.sign(
    { role: 'admin', email },
    SECRET,
    {
      expiresIn: '24h', // was 7d
      issuer: 'tkfm',
      audience: 'tkfm-admin',
    }
  )

  return json(200, { ok: true, token })
}
