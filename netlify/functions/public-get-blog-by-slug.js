// netlify/functions/public-get-blog-by-slug.js — ENTERPRISE LOCKED (PUBLIC)
import { createClient } from '@supabase/supabase-js'

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
    body: JSON.stringify(obj),
  }
}

function safeSlug(v) {
  if (typeof v !== 'string') return ''
  const s = v.trim().toLowerCase()
  if (!s || s.length > 80) return ''
  if (!/^[a-z0-9-]{3,80}$/.test(s)) return ''
  return s
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' })

  const URL = process.env.SUPABASE_URL
  const ANON = process.env.SUPABASE_ANON_KEY
  if (!URL || !ANON) return json(500, { error: 'Server not configured' })

  const slug = safeSlug(event.queryStringParameters?.slug)
  if (!slug) return json(400, { error: 'Missing slug' })

  const supabase = createClient(URL, ANON)

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id,title,excerpt,cover_url,author,status,created_at,updated_at,slug,body')
      .eq('status', 'published')
      .eq('slug', slug)
      .single()

    if (error) return json(404, { error: 'Not found' })
    return json(200, { ok: true, data })
  } catch {
    return json(500, { error: 'Internal Error' })
  }
}
