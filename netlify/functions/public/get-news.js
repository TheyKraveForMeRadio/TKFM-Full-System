import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function handler() {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: error.message })
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        count: data.length,
        data
      })
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    }
  }
}
