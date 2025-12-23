const Stripe = require('stripe')
const crypto = require('crypto')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

/**
 * FINAL LOCK CONFIG
 * - FEATURE_PRICE_ALLOWLIST: comma-separated Stripe Price IDs allowed for mixtape features
 * - REDIRECT_ALLOWLIST: comma-separated allowed redirect ORIGINS (not paths)
 *
 * Example:
 * FEATURE_PRICE_ALLOWLIST=price_123,price_456
 * REDIRECT_ALLOWLIST=https://tkfmradio.com,https://www.tkfmradio.com,https://main--yoursite.netlify.app
 */
const FEATURE_PRICE_ALLOWLIST = new Set(
  (process.env.FEATURE_PRICE_ALLOWLIST || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
)

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
  if (body.length > 200_000) return null
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

function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : h.trim()
}

/**
 * Optional: DJ auth gate (enable if you require DJ token to create checkout)
 * Set REQUIRE_DJ_AUTH=true to enforce a token exists.
 * You can later verify token in _helpers.js; for now this just requires presence.
 */
function requireDjToken(event) {
  if (String(process.env.REQUIRE_DJ_AUTH || '').toLowerCase() !== 'true') return null
  const token = getBearer(event)
  if (!token) return json(401, { error: 'Unauthorized' })
  return null
}

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  // Config lock
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'Server not configured' })
  if (FEATURE_PRICE_ALLOWLIST.size === 0) return json(500, { error: 'Feature pricing not configured' })
  if (REDIRECT_ALLOWLIST.size === 0) return json(500, { error: 'Redirects not configured' })

  // Optional DJ token requirement
  const deny = requireDjToken(event)
  if (deny) return deny

  const payload = safeParse(event.body)
  if (!payload) return json(400, { error: 'Invalid JSON' })

  // Accept either:
  // { mixtapeId, priceId, successUrl, cancelUrl }
  // OR { mixtapeId, tier, successUrl, cancelUrl } with tier mapping below
  const mixtapeId = payload.mixtapeId
  const successUrl = payload.successUrl
  const cancelUrl = payload.cancelUrl

  if (typeof mixtapeId !== 'string' || mixtapeId.length < 3 || mixtapeId.length > 128) {
    return json(400, { error: 'Invalid mixtapeId' })
  }

  if (!isAllowedRedirect(successUrl) || !isAllowedRedirect(cancelUrl)) {
    return json(400, { error: 'Invalid redirect URL' })
  }

  // Price selection (allowlist enforced)
  let priceId = payload.priceId

  // Optional tier mapping (recommended: client sends tier, not priceId)
  // Configure env like: FEATURE_PRICE_ELITE, FEATURE_PRICE_PRO, FEATURE_PRICE_BASIC
  if (!priceId && typeof payload.tier === 'string') {
    const tier = payload.tier.toLowerCase()
    if (tier === 'elite') priceId = process.env.FEATURE_PRICE_ELITE
    else if (tier === 'pro') priceId = process.env.FEATURE_PRICE_PRO
    else if (tier === 'basic') priceId = process.env.FEATURE_PRICE_BASIC
  }

  if (typeof priceId !== 'string' || !FEATURE_PRICE_ALLOWLIST.has(priceId)) {
    return json(400, { error: 'Invalid price' })
  }

  // Idempotency to prevent duplicate sessions
  const idem =
    event.headers?.['x-idempotency-key'] ||
    event.headers?.['X-Idempotency-Key'] ||
    crypto
      .createHash('sha256')
      .update(`${mixtapeId}|${priceId}|${successUrl}|${cancelUrl}|${event.headers?.['x-forwarded-for'] || ''}`)
      .digest('hex')

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],

        // FINAL LOCK: attach metadata for webhook fulfillment
        metadata: {
          tkfm_action: 'feature_mixtape',
          mixtapeId,
          priceId,
        },

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
