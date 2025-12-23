// netlify/functions/staff-verify.js — ENTERPRISE LOCKED
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
  if (!h || typeof h !== 'string') return ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock (verify endpoints should be GET)
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' })

  const SECRET = process.env.STAFF_JWT_SECRET
  if (!SECRET) return json(500, { error: 'Server not configured' })

  const token = getBearer(event)
  if (!token) return json(401, { error: 'Unauthorized' })

  try {
    // Verify with the same issuer/audience used in staff-login.js
    const decoded = jwt.verify(token, SECRET, {
      issuer: 'tkfm',
      audience: 'tkfm-staff',
    })

    if (!decoded || decoded.role !== 'staff') {
      return json(403, { error: 'Forbidden' })
    }

    return json(200, {
      authorized: true,
      email: decoded.email || null,
      role: decoded.role,
    })
  } catch {
    return json(401, { error: 'Invalid or expired token' })
  }
}
