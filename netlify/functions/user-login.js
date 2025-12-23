// netlify/functions/user-login.js — ENTERPRISE LOCKED
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
  if (body.length > 50_000) return null
  try { return JSON.parse(body) } catch { return null }
}

function normEmail(email) {
  if (typeof email !== 'string') return ''
  return email.trim().toLowerCase()
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json(500, { error: 'Server not configured' })
  }

  const body = safeParse(event.body)
  if (!body) return json(400, { error: 'Invalid JSON' })

  const email = normEmail(body.email)
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return json(400, { error: 'Email and password required' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data?.session || !data?.user) {
      // Don’t forward upstream error messages (prevents enumeration/leaks)
      return json(401, { error: 'Invalid credentials' })
    }

    return json(200, {
      ok: true,
      // return only what the client needs
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch {
    return json(500, { error: 'Login failed' })
  }
}
