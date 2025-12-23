// netlify/functions/admin-delete-news.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

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

function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  if (!h || typeof h !== 'string') return ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}

function safeId(v) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  // allow uuid or numeric string ids
  if (!s || s.length > 64) return ''
  return s
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'DELETE') return json(405, { error: 'Method Not Allowed' })

  // Config lock
  const SECRET = process.env.ADMIN_JWT_SECRET
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SECRET || !SUPABASE_URL || !SERVICE_KEY) {
    return json(500, { error: 'Server not configured' })
  }

  // AUTH
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

  if (!decoded || decoded.role !== 'admin') {
    return json(403, { error: 'Forbidden' })
  }

  // INPUT
  const payload = safeParse(event.body)
  if (!payload) return json(400, { error: 'Invalid JSON' })

  const id = safeId(payload.id)
  if (!id) return json(400, { error: 'Missing news post ID' })

  // SUPABASE (SERVICE ROLE)
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  try {
    const { error } = await supabase
      .from('news')         // ✅ match admin-create-news.js
      .delete()
      .eq('id', id)

    if (error) return json(500, { error: 'Database delete failed' })

    return json(200, { ok: true, message: 'News post deleted', id })
  } catch {
    return json(500, { error: 'Internal Error' })
  }
}
