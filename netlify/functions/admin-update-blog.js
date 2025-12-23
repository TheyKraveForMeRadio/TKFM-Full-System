// netlify/functions/admin-update-blog.js — ENTERPRISE LOCKED
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
  if (!body || typeof body !== 'string') return null
  if (body.length > 200_000) return null
  try { return JSON.parse(body) } catch { return null }
}
function safeId(v) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  return s && s.length <= 64 ? s : ''
}
function safeString(x, min, max) {
  if (x === undefined) return undefined
  if (x === null) return null
  if (typeof x !== 'string') return null
  const s = x.trim()
  if (s.length < min) return null
  return s.length > max ? s.slice(0, max) : s
}
function safeSlug(v) {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v !== 'string') return null
  const s = v.trim().toLowerCase()
  if (!s) return null
  if (!/^[a-z0-9-]{3,80}$/.test(s)) return null
  return s
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'PATCH') return json(405, { error: 'Method Not Allowed' })

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

  const update = { updated_at: new Date().toISOString() }

  if (payload.title !== undefined) {
    const v = safeString(payload.title, 3, 140)
    if (v === null) return json(400, { error: 'Invalid title' })
    update.title = v
  }
  if (payload.excerpt !== undefined) {
    const v = safeString(payload.excerpt, 0, 280)
    if (v === null) return json(400, { error: 'Invalid excerpt' })
    update.excerpt = v
  }
  if (payload.cover_url !== undefined) {
    const v = safeString(payload.cover_url, 0, 500)
    if (v === null) return json(400, { error: 'Invalid cover_url' })
    update.cover_url = v
  }
  if (payload.slug !== undefined) {
    const v = safeSlug(payload.slug)
    if (v === null) return json(400, { error: 'Invalid slug' })
    update.slug = v
  }
  if (payload.body !== undefined) {
    const v = safeString(payload.body, 20, 40000)
    if (v === null) return json(400, { error: 'Invalid body' })
    update.body = v
  }

  // optional status change
  if (payload.status !== undefined) {
    const s = String(payload.status || '').toLowerCase()
    if (s !== 'draft' && s !== 'published') return json(400, { error: 'Invalid status' })
    update.status = s
  }

  if (Object.keys(update).length === 1) return json(400, { error: 'No fields to update' })

  const supabase = createClient(URL, KEY)

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(update)
      .eq('id', id)
      .select('id,title,excerpt,cover_url,author,status,created_at,updated_at,slug')
      .single()

    if (error) return json(500, { error: 'Update failed' })
    return json(200, { ok: true, data })
  } catch {
    return json(500, { error: 'Internal Error' })
  }
}
