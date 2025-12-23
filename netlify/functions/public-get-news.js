// netlify/functions/public-get-news.js — ENTERPRISE LOCKED (PUBLIC)
import { createClient } from '@supabase/supabase-js'

function json(statusCode, obj) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(obj) }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' })

  const URL = process.env.SUPABASE_URL
  const ANON = process.env.SUPABASE_ANON_KEY
  if (!URL || !ANON) return json(500, { error: 'Server not configured' })

  const supabase = createClient(URL, ANON)

  const limit = Math.min(50, Math.max(1, Number(event.queryStringParameters?.limit || 10)))
  try {
    const { data, error } = await supabase
      .from('news')
      .select('id,title,body,image_url,author,published,created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return json(500, { error: 'Query failed' })
    return json(200, { ok: true, data: data || [] })
  } catch {
    return json(500, { error: 'Internal Error' })
  }
}
