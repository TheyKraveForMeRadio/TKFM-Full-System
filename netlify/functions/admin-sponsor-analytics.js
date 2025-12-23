// netlify/functions/admin-sponsor-analytics.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'
import { getStore } from './_helpers.js'

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  }
}

function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return typeof h === 'string' && h.startsWith('Bearer ')
    ? h.slice(7).trim()
    : ''
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' })

  const SECRET = process.env.ADMIN_JWT_SECRET
  if (!SECRET) return json(500, { error: 'Server not configured' })

  const token = getBearer(event)
  if (!token) return json(401, { error: 'Unauthorized' })

  let decoded
  try {
    decoded = jwt.verify(token, SECRET, {
      issuer: 'tkfm',
      audience: 'tkfm-admin',
    })
  } catch {
    return json(401, { error: 'Invalid or expired token' })
  }

  if (decoded.role !== 'admin') {
    return json(403, { error: 'Forbidden' })
  }

  const sponsors = (await getStore('sponsors')) || []

  // 🔒 Return analytics-only fields
  const data = sponsors.map(s => ({
    id: s.id,
    name: s.name,
    tier: s.tier || 'standard',
    impressions: s.impressions || 0,
    clicks: s.clicks || 0,
    ctr:
      s.impressions > 0
        ? Number(((s.clicks || 0) / s.impressions * 100).toFixed(2))
        : 0,
    active: s.active !== false,
  }))

  return json(200, { ok: true, data })
}

