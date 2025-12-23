// netlify/functions/dj-login.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'
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
  if (body.length > 10_000) return null
  try { return JSON.parse(body) } catch { return null }
}

function getIP(event) {
  const h = event.headers || {}
  const ip =
    h['x-nf-client-connection-ip'] ||
    (typeof h['x-forwarded-for'] === 'string' ? h['x-forwarded-for'].split(',')[0].trim() : '') ||
    ''
  return ip || 'unknown'
}

function cleanEmail(v) {
  return String(v || '').trim().toLowerCase()
}

async function rateLimit(ip) {
  // Lightweight lock: 10 attempts / 10 minutes per IP
  const key = `dj_login_rl_${ip}`
  const store = (await getStore('rate_limits')) || {}
  const now = Date.now()

  const windowMs = 10 * 60 * 1000
  const max = 10

  const entry = store[key] || { count: 0, resetAt: now + windowMs }
  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + windowMs
  }

  entry.count += 1
  store[key] = entry

  // Cap store size (basic hygiene)
  const keys = Object.keys(store)
  if (keys.length > 5000) {
    // crude prune: drop oldest-ish by resetAt
    keys
      .sort((a, b) => (store[a]?.resetAt || 0) - (store[b]?.resetAt || 0))
      .slice(0, 1000)
      .forEach(k => delete store[k])
  }

  await setStore('rate_limits', store)

  if (entry.count > max) {
    const err = new Error('Too many attempts. Try again later.')
    err.statusCode = 429
    throw err
  }
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  try {
    const ip = getIP(event)
    await rateLimit(ip)

    const payload = safeParse(event.body)
    if (!payload) return json(400, { error: 'Invalid JSON' })

    const email = cleanEmail(payload.email)
    const password = String(payload.password || '')

    if (!email || !password) return json(400, { error: 'Email and password required' })

    // ✅ DJ-specific env vars (do not reuse admin/staff secret)
    const allowedEmail = cleanEmail(process.env.DJ_EMAIL)
    const allowedPassword = String(process.env.DJ_PASSWORD || '')
    const SECRET = String(process.env.DJ_JWT_SECRET || '')

    if (!allowedEmail || !allowedPassword || !SECRET) {
      console.error('DJ login misconfigured (missing DJ_EMAIL/DJ_PASSWORD/DJ_JWT_SECRET)')
      return json(500, { error: 'Auth misconfigured' })
    }

    if (email !== allowedEmail || password !== allowedPassword) {
      // Avoid leaking details
      return json(401, { error: 'Invalid credentials' })
    }

    // ✅ Enterprise JWT: role + issuer + audience
    const token = jwt.sign(
      { role: 'dj', email: allowedEmail },
      SECRET,
      {
        expiresIn: '24h',
        issuer: 'tkfm',
        audience: 'tkfm-dj',
      }
    )

    return json(200, { ok: true, token })
  } catch (err) {
    const status = err.statusCode || 500
    return json(status, { error: err.message || 'DJ login failed' })
  }
}

