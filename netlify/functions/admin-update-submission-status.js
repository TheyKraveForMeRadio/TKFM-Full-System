// netlify/functions/admin-update-submission-status.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

function json(statusCode, obj) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(obj) }
}
function safeParse(body) {
  if (!body || typeof body !== 'string') return null
  if (body.length > 10_000) return null
  try { return JSON.parse(body) } catch { return null }
}
function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}
function cleanStr(v, max = 60) {
  const s = String(v || '').trim()
  return s.length > max ? s.slice(0, max) : s
}

const ALLOWED = new Set(['new', 'reviewing', 'accepted', 'rejected'])

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

  const id = cleanStr(payload.id, 80)
  const status = cleanStr(payload.status, 20).toLowerCase()

  if (!id) return json(400, { error: 'Missing id' })
  if (!ALLOWED.has(status)) return json(400, { error: 'Invalid status' })

  const supabase = createClient(URL, KEY)

  const { data, error } = await supabase
    .from('submissions')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return json(500, { error: 'Update failed' })

  return json(200, { ok: true, data })
}
