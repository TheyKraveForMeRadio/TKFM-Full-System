// netlify/functions/admin-list-submissions.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

function json(statusCode, obj) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(obj) }
}
function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}
function safeStr(v, max = 120) {
  const s = String(v || '').trim()
  return s.length > max ? s.slice(0, max) : s
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

  const supabase = createClient(URL, KEY)

  const q = safeStr(event.queryStringParameters?.q, 80)
  const status = safeStr(event.queryStringParameters?.status, 20)

  let query = supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(200)

  if (status) query = query.eq('status', status)
  if (q) {
    // Search across common fields
    query = query.or(`artist_name.ilike.%${q}%,track_title.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return json(500, { error: 'Query failed' })

  return json(200, { ok: true, data: data || [] })
}
