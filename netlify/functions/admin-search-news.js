// netlify/functions/admin-search-news.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

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

function safeQ(v) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  if (!s) return ''
  return s.length > 80 ? s.slice(0, 80) : s
}

function safeLimit(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 20
  return Math.min(50, Math.max(1, Math.floor(n)))
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' })

  const SECRET = process.env.ADMIN_JWT_SECRET
  const URL = process.env.SUPABASE_URL
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SECRET || !URL || !KEY) return json(500, { error: 'Server not configured' })

  const token = getBearer(event)
  if (!token) return json(401, { error: 'Unauthorized' })

  let decoded
  try {
    decoded = jwt.verify(token, SECRET, { issuer: 'tkfm', audience: 'tkfm-admin' })
  } catch {
    return json(401, { error: 'Invalid or expired token' })
  }
  if (decoded.role !== 'admin') return json(403, { error: 'Forbidden' })

  const q = safeQ(event.queryStringParameters?.q)
  if (!q) return json(400, { error: 'Missing q' })

  const publishedParam = String(event.queryStringParameters?.published || 'all').toLowerCase()
  const limit = safeLimit(event.queryStringParameters?.limit)

  const supabase = createClient(URL, KEY)

  try {
    // Use ilike across multiple fields via `or()`
    // Note: This is safe for typical usage; we cap q length.
    let query = supabase
      .from('news')
      .select('*')
      .or(`title.ilike.%${q}%,body.ilike.%${q}%,author.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (publishedParam === 'true') query = query.eq('published', true)
    if (publishedParam === 'false') query = query.eq('published', false)

    const { data, error } = await query
    if (error) return json(500, { error: 'Search failed' })

    return json(200, { ok: true, q, count: (data || []).length, data: data || [] })
  } catch {
    return json(500, { error: 'Internal Error' })
  }
}
