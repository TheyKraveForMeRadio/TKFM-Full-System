// netlify/functions/admin-update-news.js — ENTERPRISE LOCKED (helpers version)
import { createSupabaseClient, verifyAdmin } from './_helpers.js'

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

function safeId(v) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  return s && s.length <= 64 ? s : ''
}

function safeString(x, min, max) {
  if (x === null || x === undefined) return null
  if (typeof x !== 'string') return null
  const s = x.trim()
  if (s.length < min) return null
  return s.length > max ? s.slice(0, max) : s
}

function safeTags(v) {
  if (v === null || v === undefined) return null
  // allow string or array of strings; store as comma string for simplicity
  if (typeof v === 'string') {
    const s = v.trim()
    return s ? s.slice(0, 200) : null
  }
  if (Array.isArray(v)) {
    const cleaned = v
      .filter(x => typeof x === 'string')
      .map(x => x.trim())
      .filter(Boolean)
      .slice(0, 20)
    return cleaned.length ? cleaned.join(',') : null
  }
  return null
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'PATCH') return json(405, { error: 'Method Not Allowed' })

  try {
    // Require admin token (helpers should throw if invalid)
    // Ideally returns decoded claims, but we don't depend on it here.
    verifyAdmin(event)

    const payload = safeParse(event.body)
    if (!payload) return json(400, { error: 'Invalid JSON' })

    const id = safeId(payload.id)
    if (!id) return json(400, { error: 'Missing id' })

    // Build update object ONLY with provided fields
    const update = { updated_at: new Date().toISOString() }

    if (payload.title !== undefined) {
      const t = safeString(payload.title, 3, 140)
      if (!t) return json(400, { error: 'Invalid title' })
      update.title = t
    }

    if (payload.body !== undefined) {
      const b = safeString(payload.body, 20, 20000)
      if (!b) return json(400, { error: 'Invalid body' })
      update.body = b
    }

    if (payload.tags !== undefined) {
      update.tags = safeTags(payload.tags)
    }

    // If nothing to change besides updated_at, reject
    if (Object.keys(update).length === 1) {
      return json(400, { error: 'No fields to update' })
    }

    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('news') // ✅ standardized table
      .update(update)
      .eq('id', id)
      .select('id,title,body,image_url,author,published,created_at,updated_at,tags')
      .single()

    if (error) return json(500, { error: 'Update failed' })

    return json(200, { ok: true, data })
  } catch {
    // Don’t leak internal errors
    return json(401, { error: 'Unauthorized' })
  }
}
