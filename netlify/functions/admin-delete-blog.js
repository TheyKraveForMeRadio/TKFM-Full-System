// netlify/functions/admin-delete-blog.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

function json(statusCode, obj) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(obj) }
}
function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}
function safeParse(body) {
  if (!body || typeof body !== 'string' || body.length > 20_000) return null
  try { return JSON.parse(body) } catch { return null }
}
function safeId(v) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  return s && s.length <= 64 ? s : ''
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'DELETE') return json(405, { error: 'Method Not Allowed' })

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

  const payload = safeParse(event.body)
  if (!payload) return json(400, { error: 'Invalid JSON' })

  const id = safeId(payload.id)
  if (!id) return json(400, { error: 'Missing id' })

  const supabase = createClient(URL, KEY)

  try {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) return json(500, { error: 'Delete failed' })
    return json(200, { ok: true, deleted: true, id })
  } catch {
    return json(500, { error: 'Internal Error' })
  }
}
