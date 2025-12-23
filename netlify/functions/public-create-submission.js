// netlify/functions/public-create-submission.js — ENTERPRISE LOCKED (PUBLIC + SENDGRID NOTIFY)
import { createClient } from '@supabase/supabase-js'

function json(statusCode, obj) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(obj) }
}
function safeParse(body) {
  if (!body || typeof body !== 'string') return null
  if (body.length > 50_000) return null
  try { return JSON.parse(body) } catch { return null }
}
function s(v, min, max) {
  if (typeof v !== 'string') return ''
  const t = v.trim()
  if (t.length < min) return ''
  return t.length > max ? t.slice(0, max) : t
}
function safeUrl(v) {
  if (!v || typeof v !== 'string') return null
  const t = v.trim()
  if (!t || t.length > 800) return null
  try {
    const u = new URL(t)
    if (u.protocol !== 'https:' && u.hostname !== 'localhost') return null
    return u.toString()
  } catch { return null }
}
async function sendgridNotify({ plan, artist_name, track_title, email, audio_url, cover_url, notes }) {
  const apiKey = process.env.SENDGRID_API_KEY
  const to = process.env.SUBMISSIONS_NOTIFY_EMAIL
  const from = process.env.SENDGRID_FROM_EMAIL

  if (!apiKey || !to || !from) return // silently skip if not configured

  const subject = `TKFM New Submission — ${artist_name} — ${track_title}`
  const text =
`New TKFM submission received.

Plan: ${plan}
Artist: ${artist_name}
Track: ${track_title}
Email: ${email}

Audio: ${audio_url}
Cover: ${cover_url || '-'}
Notes: ${notes || '-'}

Admin: /admin/submissions.html
`

  // Node 18+ has fetch in Netlify Functions
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: 'text/plain', value: text }]
    })
  })
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  const URL = process.env.SUPABASE_URL
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!URL || !KEY) return json(500, { error: 'Server not configured' })

  const payload = safeParse(event.body)
  if (!payload) return json(400, { error: 'Invalid JSON' })

  const plan = s(payload.plan, 3, 40) || 'SUBMIT_BASIC'
  const artist_name = s(payload.artist_name, 2, 80)
  const track_title = s(payload.track_title, 2, 120)
  const email = s(payload.email, 5, 120)
  const audio_url = safeUrl(payload.audio_url)
  const cover_url = safeUrl(payload.cover_url)
  const notes = s(payload.notes, 0, 2000) || null

  if (!artist_name || !track_title || !email || !audio_url) {
    return json(400, { error: 'Missing required fields' })
  }

  const supabase = createClient(URL, KEY)
  const { data, error } = await supabase
    .from('submissions')
    .insert([{
      plan,
      artist_name,
      track_title,
      email,
      audio_url,
      cover_url,
      notes,
      status: 'new',
      archived: false
    }])
    .select()
    .single()

  if (error) return json(500, { error: 'Insert failed' })

  // Best-effort email notify (never blocks success)
  try {
    await sendgridNotify({ plan, artist_name, track_title, email, audio_url, cover_url, notes })
  } catch (e) {
    console.warn('SendGrid notify failed:', e?.message || e)
  }

  return json(200, { ok: true, id: data.id })
}

