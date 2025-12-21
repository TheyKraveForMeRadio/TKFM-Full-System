import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const handler = async (event) => {
  try {
    const auth = event.headers.authorization || ''
    const token = auth.replace('Bearer ', '')

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: 'Missing token' })
      }
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: 'Invalid token' })
      }
    }

    if (decoded.role !== 'admin') {
      return {
        statusCode: 403,
        body: JSON.stringify({ ok: false, error: 'Forbidden' })
      }
    }

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, data })
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    }
  }
}
