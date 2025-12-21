// netlify/functions/admin-create-news.js
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      }
    }

    // ======================
    // AUTH
    // ======================
    const SECRET = process.env.ADMIN_JWT_SECRET
    const auth = event.headers.authorization || ''

    if (!auth.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized — missing token' }),
      }
    }

    let decoded
    try {
      decoded = jwt.verify(auth.split(' ')[1], SECRET)
    } catch {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid or expired token' }),
      }
    }

    if (decoded.role !== 'admin') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden — admin only' }),
      }
    }

    // ======================
    // INPUT
    // ======================
    const { title, body, image_url, published = false } = JSON.parse(
      event.body || '{}'
    )

    if (!title || !body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'title and body are required' }),
      }
    }

    // ======================
    // SUPABASE (SERVICE ROLE)
    // ======================
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('news')
      .insert([
        {
          title,
          body,
          image_url: image_url || null,
          author: decoded.email,
          published,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message: 'News post created',
        data,
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
