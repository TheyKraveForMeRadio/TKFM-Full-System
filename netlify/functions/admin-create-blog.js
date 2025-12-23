// netlify/functions/admin-create-blog.js — ENTERPRISE LOCKED
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

function safeParse(body) {
  if (!body || typeof body !== 'string' || body.length > 200_000) return null
  try { return JSON.parse(body) } catch { return null }
}

function safeString(x, min, max) {
  if (typeof x !== 'string') return ''
  const s = x.trim()
  if (s.length < min) return ''
  return s.length > max ? s.slice(0, max) : s
}

function safeSlug(v) {
  if (v == null) return null
  if (typeof v !== 'string') return null
  const s = v.trim().toLowerCase()
  if (!s) return null
  // allow a-z 0-9 and hyphen only
  if (!/^[a-z0-9-]{3,80}$/.test(s)) return null
  return s
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

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

  const payload = safeParse(event.body)
  if (!payload) return json(400, { error: 'Invalid JSON' })

  const title = safeString(payload.title, 3, 140)
  const content = safeString(payload.body, 20, 40000)
  const excerpt = safeString(payload.excerpt || '', 0, 280) || null

  // status matches your public-get-blog filter: status = "published"
  const published = payload.published === true
  const status = published ? 'published' : 'draft'

  const slug = safeSlug(payload.slug)

  if (!title || !content) return json(400, { error: 'title and body are required' })

  const supabase = createClient(URL, KEY)

  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        title,
        body: content,
        excerpt,
        slug,
        status,
        author: decoded.email || null,
        created_at: now,
        updated_at: now,
      }])
      .select('id,title,status,created_at,slug')
      .single()

    if (error) return json(500, { error: 'Database insert failed' })

    return json(200, { ok: true, data })
  } catch {
    return json(500, { error: 'Internal Error' })
  }
}
