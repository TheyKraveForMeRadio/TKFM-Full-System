const Stripe = require('stripe')
const crypto = require('crypto')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// FINAL LOCK: allowlist prices (do NOT accept arbitrary priceId from client)
const PRICE_ALLOWLIST = new Set(
  (process.env.STRIPE_PRICE_ALLOWLIST || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
)

// FINAL LOCK: allowlist redirect origins/domains
const REDIRECT_ALLOWLIST = new Set(
  (process.env.REDIRECT_ALLOWLIST || '')
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
  try { return JSON.parse(body) } catch { return null }
}

function isAllowedRedirect(url) {
  if (typeof url !== 'string' || url.length > 500) return false
  try {
    const u = new URL(url)
    // require https in production
    if (u.protocol !== 'https:' && u.hostname !== 'localhost') return false

    const origin = u.origin
    return REDIRECT_ALLOWLIST.size > 0 && REDIRECT_ALLOWLIST.has(origin)
  } catch {
    return false
  }
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  // Must be configured
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'Server not configured' })
  if (PRICE_ALLOWLIST.size === 0) return json(500, { error: 'Pricing not configured' })
  if (REDIRECT_ALLOWLIST.size === 0) return json(500, { error: 'Redirects not configured' })

  const payload = safeParse(event.body)
  if (!payload) return json(400, { error: 'Invalid JSON' })

  const priceId = payload.priceId
  const successUrl = payload.successUrl
  const cancelUrl = payload.cancelUrl

  if (typeof priceId !== 'string' || !PRICE_ALLOWLIST.has(priceId)) {
    return json(400, { error: 'Invalid price' })
  }

  if (!isAllowedRedirect(successUrl) || !isAllowedRedirect(cancelUrl)) {
    return json(400, { error: 'Invalid redirect URL' })
  }

  // Idempotency (prevents duplicate sessions on retries)
  const idem =
    event.headers?.['x-idempotency-key'] ||
    event.headers?.['X-Idempotency-Key'] ||
    crypto.createHash('sha256').update(`${priceId}|${successUrl}|${cancelUrl}|${event.headers?.['x-forwarded-for'] || ''}`).digest('hex')

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      { idempotencyKey: idem }
    )

    return json(200, { url: session.url })
  } catch {
    // Don’t leak Stripe error details to public client
    return json(500, { error: 'Checkout creation failed' })
  }
}
