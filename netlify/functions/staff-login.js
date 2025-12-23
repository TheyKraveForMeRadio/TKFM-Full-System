// netlify/functions/staff-login.js — ENTERPRISE LOCKED
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

// Constant-time-ish compare to reduce timing leaks
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

function normEmail(email) {
  if (typeof email !== 'string') return ''
  return email.trim().toLowerCase()
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  // Config lock
  const STAFF_EMAIL = process.env.STAFF_EMAIL
  const STAFF_PASSWORD = process.env.STAFF_PASSWORD
  const SECRET = process.env.STAFF_JWT_SECRET

  if (!STAFF_EMAIL || !STAFF_PASSWORD || !SECRET) {
    return json(500, { error: 'Server not configured' })
  }

  const body = safeParse(event.body)
  if (!body) return json(400, { error: 'Invalid JSON' })

  const email = normEmail(body.email)
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return json(400, { error: 'Email and password required' })
  }

  // Normalize configured email the same way
  const configuredEmail = normEmail(STAFF_EMAIL)

  // Auth check
  const okEmail = safeEqual(email, configuredEmail)
  const okPass = safeEqual(password, STAFF_PASSWORD)

  if (!okEmail || !okPass) {
    // Do not reveal which field failed
    return json(401, { error: 'Invalid credentials' })
  }

  // Staff JWT (staff role only)
  // FINAL LOCK: shorter TTL is safer; refresh by logging in again.
  const token = jwt.sign(
    { role: 'staff', email },
    SECRET,
    {
      expiresIn: '24h', // was 7d; safer for production
      issuer: 'tkfm',
      audience: 'tkfm-staff',
    }
  )

  return json(200, { ok: true, token })
}
