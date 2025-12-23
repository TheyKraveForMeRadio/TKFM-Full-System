// netlify/functions/admin-export-submissions-csv.js — ENTERPRISE LOCKED
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}
function safeBool(v) {
  const s = String(v || '').toLowerCase()
  return s === '1' || s === 'true' || s === 'yes'
}
function csvEscape(v) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' }

  const SECRET = process.env.ADMIN_JWT_SECRET
  const URL = process.env.SUPABASE_URL
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SECRET || !URL || !KEY) return { statusCode: 500, body: 'Server not configured' }

  const token = getBearer(event)
  if (!token) return { statusCode: 401, body: 'Unauthorized' }

  let decoded
  try {
    decoded = jwt.verify(token, SECRET, { issuer: 'tkfm', audience: 'tkfm-admin' })
  } catch {
    return { statusCode: 401, body: 'Invalid or expired token' }
  }
  if (decoded.role !== 'admin') return { statusCode: 403, body: 'Forbidden' }

  const includeArchived = safeBool(event.queryStringParameters?.includeArchived)

  const supabase = createClient(URL, KEY)
  let q = supabase
    .from('submissions')
    .select('id,created_at,plan,status,artist_name,track_title,email,audio_url,cover_url,notes,archived,archived_at')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (!includeArchived) q = q.eq('archived', false)

  const { data, error } = await q
  if (error) return { statusCode: 500, body: 'Query failed' }

  const rows = data || []
  const header = [
    'id','created_at','plan','status','artist_name','track_title','email',
    'audio_url','cover_url','notes','archived','archived_at'
  ]

  const csv =
    header.join(',') + '\n' +
    rows.map(r => header.map(k => csvEscape(r[k])).join(',')).join('\n')

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tkfm-submissions.csv"',
      'Cache-Control': 'no-store',
    },
    body: csv
  }
}
