// netlify/functions/admin-list-blog.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

function json(statusCode, obj) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(obj) }
}
function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}
function safeInt(v, d, min, max) {
  const n = Number(v)
  if (!Number.isFinite(n)) return d
  return Math.min(max, Math.max(min, Math.floor(n)))
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
  try { decoded = jwt.verify(token, SECRET, { issuer: 'tkfm', audience: 'tkfm-admin' }) }
  catch { return json(401, { error: 'Invalid or expired token' }) }
  if (decoded.role !== 'admin') return json(403, { error: 'Forbidden' })

  const supabase = createClient(URL, KEY)

  const limit = safeInt(event.queryStringParameters?.limit, 50, 1, 100)
  const offset = safeInt(event.queryStringParameters?.offset, 0, 0, 10000)
  const status = String(event.queryStringParameters?.status || 'all').toLowerCase() // all|draft|published

  try {
    let q = supabase
      .from('blog_posts')
      .select('id,title,excerpt,cover_url,author,status,created_at,updated_at,slug')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status === 'draft') q = q.eq('status', 'draft')
    if (status === 'published') q = q.eq('status', 'published')

    const { data, error } = await q
    if (error) return json(500, { error: 'Query failed' })

    return json(200, { ok: true, data: data || [], limit, offset, status })
  } catch {
    return json(500, { error: 'Internal Error' })
  }
}
