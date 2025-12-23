// netlify/functions/user-verify.js — ENTERPRISE LOCKED
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
  if (!h || typeof h !== 'string') return ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' })

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json(500, { error: 'Server not configured' })
  }

  const token = getBearer(event)
  if (!token) return json(401, { error: 'Unauthorized' })

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return json(401, { error: 'Invalid or expired token' })

    const u = data.user
    return json(200, {
      authorized: true,
      user_id: u.id,
      email: u.email || null,
      role: (u.user_metadata && u.user_metadata.role) || 'user',
    })
  } catch {
    return json(500, { error: 'Verify failed' })
  }
}
