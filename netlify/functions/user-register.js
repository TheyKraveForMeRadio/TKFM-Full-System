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

function validPassword(pw) {
  if (typeof pw !== 'string') return false
  // Adjust policy if you want stricter
  return pw.length >= 8 && pw.length <= 72
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json(500, { error: 'Server not configured' })
  }

  const body = safeParse(event.body)
  if (!body) return json(400, { error: 'Invalid JSON' })

  const email = normEmail(body.email)
  const password = body.password

  if (!email || !validPassword(password)) {
    return json(400, { error: 'Invalid email or password' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    // Public signup (Supabase handles confirmation flow based on project settings)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'user' },
      },
    })

    if (error) {
      // Avoid leaking exact reason (prevents enumeration)
      return json(400, { error: 'Unable to register' })
    }

    return json(200, {
      ok: true,
      message: 'Registered',
      // Don’t return full internal objects
      user: data?.user ? { id: data.user.id, email: data.user.email } : null,
    })
  } catch {
    return json(500, { error: 'Registration failed' })
  }
}
