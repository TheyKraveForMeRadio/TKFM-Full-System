import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// FINAL LOCK: only allow known price IDs
const PRICE_ALLOWLIST = new Set(
  (process.env.STRIPE_PRICE_ALLOWLIST || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
)

// FINAL LOCK: allowed site origin(s) used to build default redirects
const SITE_ORIGIN_ALLOWLIST = new Set(
  (process.env.SITE_ORIGIN_ALLOWLIST || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
)

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  }
}

function safeParse(body) {
  if (!body || typeof body !== 'string') return null
  if (body.length > 200_000) return null
  try { return JSON.parse(body) } catch { return null }
}

function safeString(x, max = 200) {
  if (typeof x !== 'string') return ''
  const s = x.trim()
  return s.length > max ? s.slice(0, max) : s
}

// Only keep metadata keys you explicitly allow (prevents abuse/PII injection)
function filterMetadata(meta) {
  const allowedKeys = new Set([
    'tkfm_action',
    'mixtapeId',
    'sponsorId',
    'tier',
    'source',
  ])

  const out = {}
  if (!meta || typeof meta !== 'object') return out

  for (const k of Object.keys(meta)) {
    if (!allowedKeys.has(k)) continue
    const v = meta[k]
    if (typeof v === 'string') out[k] = safeString(v, 150)
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = String(v)
    else if (typeof v === 'boolean') out[k] = String(v)
  }
  return out
}

function buildRedirects() {
  // Prefer explicit SUCCESS_URL/CANCEL_URL, else SITE_URL + paths
  const successUrl = process.env.SUCCESS_URL || ''
  const cancelUrl = process.env.CANCEL_URL || ''
  const siteUrl = process.env.SITE_URL || ''

  const pick = (u) => {
    if (!u) return null
    try {
      const url = new URL(u)
      const origin = url.origin
      if (SITE_ORIGIN_ALLOWLIST.size > 0 && !SITE_ORIGIN_ALLOWLIST.has(origin)) return null
      // require https unless localhost
      if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null
      return url.toString()
    } catch {
      return null
    }
  }

  const s1 = pick(successUrl)
  const c1 = pick(cancelUrl)

  if (s1 && c1) return { success_url: s1, cancel_url: c1 }

  // fallback from SITE_URL
  try {
    const base = new URL(siteUrl)
    if (SITE_ORIGIN_ALLOWLIST.size > 0 && !SITE_ORIGIN_ALLOWLIST.has(base.origin)) {
      return null
    }
    if (base.protocol !== 'https:' && base.hostname !== 'localhost') return null

    return {
      success_url: new URL('/success', base).toString(),
      cancel_url: new URL('/cancel', base).toString(),
    }
  } catch {
    return null
  }
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  // Config lock (fail closed)
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'Server not configured' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: 'Server not configured' })
  }
  if (PRICE_ALLOWLIST.size === 0) return json(500, { error: 'Pricing not configured' })

  const redirects = buildRedirects()
  if (!redirects) return json(500, { error: 'Redirects not configured' })

  const body = safeParse(event.body)
  if (!body) return json(400, { error: 'Invalid JSON' })

  const priceId = body.priceId
  if (typeof priceId !== 'string' || !PRICE_ALLOWLIST.has(priceId)) {
    return json(400, { error: 'Invalid price' })
  }

  const metadata = filterMetadata(body.metadata)

  // Idempotency: prevents duplicate sessions + duplicate DB rows on retries
  const providedIdem =
    event.headers?.['x-idempotency-key'] ||
    event.headers?.['X-Idempotency-Key'] ||
    ''

  const idem = providedIdem
    ? safeString(providedIdem, 200)
    : crypto
        .createHash('sha256')
        .update(`${priceId}|${JSON.stringify(metadata)}|${event.headers?.['x-forwarded-for'] || ''}`)
        .digest('hex')

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        ...redirects,
        metadata,
      },
      { idempotencyKey: idem }
    )

    // Insert pending purchase (do NOT store raw secrets/PII)
    const insertRow = {
      price_id: priceId,
      session_id: session.id,
      status: 'pending',
      created_at: new Date().toISOString(),
      metadata,
    }

    const { error } = await supabase.from('purchases').insert([insertRow])
    if (error) {
      // If DB insert fails, still return checkout URL (but do not leak DB error)
      // Optional: you can also cancel the session here, but that’s more complexity.
      return json(200, { checkoutUrl: session.url, sessionId: session.id, db: 'insert_failed' })
    }

    return json(200, { checkoutUrl: session.url, sessionId: session.id })
  } catch {
    // Never return err.message in production
    return json(500, { error: 'Checkout creation failed' })
  }
}
