// netlify/functions/admin-auth.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  }
}

function safeParse(body) {
  if (!body || typeof body !== 'string') return null
  if (body.length > 10_000) return null
  try { return JSON.parse(body) } catch { return null }
}

function safeString(v, min, max) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  if (s.length < min) return ''
  return s.length > max ? s.slice(0, max) : s
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' })
  }

  // Env lock
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
  const SECRET = process.env.ADMIN_JWT_SECRET

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SECRET) {
    return json(500, { error: 'Server not configured' })
  }

  // Parse body safely
  const payload = safeParse(event.body)
  if (!payload) return json(400, { error: 'Invalid JSON' })

  const email = safeString(payload.email, 5, 200)
  const password = safeString(payload.password, 6, 200)

  if (!email || !password) {
    return json(400, { error: 'Email and password required' })
  }

  // Credential check (constant-time-ish)
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return json(401, { error: 'Invalid credentials' })
  }

  // Issue admin JWT
  const token = jwt.sign(
    {
      role: 'admin',
      email,
    },
    SECRET,
    {
      expiresIn: '6h',
      issuer: 'tkfm',
      audience: 'tkfm-admin',
    }
  )

  return json(200, {
    ok: true,
    token,
    expiresIn: '6h',
  })
}

