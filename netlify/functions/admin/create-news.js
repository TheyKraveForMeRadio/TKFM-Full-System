// netlify/functions/admin-create-news.js — ENTERPRISE LOCKED (upgraded)
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
  if (body.length > 200_000) return null
  try { return JSON.parse(body) } catch { return null }
}

function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  if (!h || typeof h !== 'string') return ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}

function safeString(x, min, max) {
  if (typeof x !== 'string') return ''
  const s = x.trim()
  if (s.length < min) return ''
  return s.length > max ? s.slice(0, max) : s
}

function safeImageUrl(url) {
  if (url == null) return null
  if (typeof url !== 'string') return null
  const u = url.trim()
  if (!u) return null
  if (u.length > 500) return null
  try {
    const parsed = new URL(u)
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') return null
    return parsed.toString()
  } catch {
    return null
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  const SECRET = process.env.ADMIN_JWT_SECRET
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SECRET || !SUPABASE_URL || !SERVICE_KEY) return json(500, { error: 'Server not configured' })

  const token = getBearer(event)
  if (!token) return json(401, { error: 'Unauthorized' })

  let decoded
  try {
    decoded = jwt.verify(token, SECRET, { issuer: 'tkfm', audience: 'tkfm-admin' })
  } catch {
    return json(401, { error: 'Invalid or expired token' })
  }
  if (!decoded || decoded.role !== 'admin') return json(403, { error: 'Forbidden' })

  const payload = safeParse(event.body)
  if (!payload) return json(400, { error: 'Invalid JSON' })

  const title = safeString(payload.title, 3, 140)
  const content = safeString(payload.body, 20, 20000)
  const image_url = safeImageUrl(payload.image_url)
  const published = payload.published === true

  if (!title || !content) return json(400, { error: 'title and body are required' })

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  try {
    // Duplicate guard: prevent same author+title created within ~30s (basic protection)
    const nowIso = new Date().toISOString()
    const recentSince = new Date(Date.now() - 30_000).toISOString()

    const { data: recent, error: recentErr } = await supabase
      .from('news')
      .select('id,title,author,created_at')
      .eq('author', decoded.email || '')
      .eq('title', title)
      .gte('created_at', recentSince)
      .limit(1)

    if (!recentErr && Array.isArray(recent) && recent.length) {
      return json(200, { ok: true, message: 'Duplicate ignored', data: recent[0] })
    }

    const { data, error } = await supabase
      .from('news')
      .insert([{
        title,
        body: content,
        image_url,
        author: decoded.email || null,
        published,
        created_at: nowIso, // safe even if DB has default
      }])
      .select('id,title,body,image_url,author,published,created_at')
      .single()

    if (error) return json(500, { error: 'Database insert failed' })

    return json(200, { ok: true, message: 'News post created', data })
  } catch {
    return json(500, { error: 'Internal Error' })
  }
}
