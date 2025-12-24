const Stripe = require('stripe')
const crypto = require('crypto')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Allowlist subscription price IDs only
const SUB_PRICE_ALLOWLIST = new Set(
  (process.env.STRIPE_SUB_PRICE_ALLOWLIST || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
)

// Allowlist redirect origins
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
    if (u.protocol !== 'https:' && u.hostname !== 'localhost') return false
    return REDIRECT_ALLOWLIST.size > 0 && REDIRECT_ALLOWLIST.has(u.origin)
  } catch {
    return false
  }
}

function isEmail(email) {
  if (typeof email !== 'string') return false
  const e = email.trim()
  if (e.length < 5 || e.length > 254) return false
  // simple safe regex (avoid over-complex)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export const handler = async (event) => {

  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  // Config checks
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'Server not configured' })
  if (SUB_PRICE_ALLOWLIST.size === 0) return json(500, { error: 'Subscription pricing not configured' })
  if (REDIRECT_ALLOWLIST.size === 0) return json(500, { error: 'Redirects not configured' })

  const payload = safeParse(event.body)
  if (!payload) return json(400, { error: 'Invalid JSON' })

  const priceId = payload.priceId
  const email = payload.email
  const successUrl = payload.successUrl
  const cancelUrl = payload.cancelUrl

  if (typeof priceId !== 'string' || !SUB_PRICE_ALLOWLIST.has(priceId)) {
    return json(400, { error: 'Invalid price' })
  }

  if (email && !isEmail(email)) {
    return json(400, { error: 'Invalid email' })
  }

  if (!isAllowedRedirect(successUrl) || !isAllowedRedirect(cancelUrl)) {
    return json(400, { error: 'Invalid redirect URL' })
  }

  const idem =
    event.headers?.['x-idempotency-key'] ||
    event.headers?.['X-Idempotency-Key'] ||
    crypto
      .createHash('sha256')
      .update(`${priceId}|${email || ''}|${successUrl}|${cancelUrl}|${event.headers?.['x-forwarded-for'] || ''}`)
      .digest('hex')

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        payment_method_types: ['card'],
        ...(email ? { customer_email: email.trim() } : {}),
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      { idempotencyKey: idem }
    )

    return json(200, { url: session.url })
  } catch {
    return json(500, { error: 'Checkout creation failed' })
  }
}
