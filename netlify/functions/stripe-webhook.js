import Stripe from 'stripe'
import { getStore, setStore } from './_helpers.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

const DAYS = { basic: 7, pro: 14, elite: 30 }

function cleanStr(v) {
  return String(v || '').trim()
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  }
}

function getStripeSig(event) {
  return (
    event?.headers?.['stripe-signature'] ||
    event?.headers?.['Stripe-Signature'] ||
    ''
  )
}

function getRawBody(event) {
  // Stripe needs the exact raw payload used for signature verification
  const body = event?.body || ''
  if (!body) return ''
  if (event.isBase64Encoded) {
    try {
      return Buffer.from(body, 'base64').toString('utf8')
    } catch {
      return ''
    }
  }
  return body
}

export async function handler(event) {
  // Webhooks should not be called by browsers; no CORS needed.
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return json(500, { error: 'Server not configured' })
  }

  const sig = getStripeSig(event)
  if (!sig) return json(400, { error: 'Missing Stripe signature' })

  const rawBody = getRawBody(event)
  if (!rawBody) return json(400, { error: 'Missing body' })

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch {
    // Do not leak error details
    return json(400, { error: 'Webhook signature verification failed' })
  }

  // Only care about completed checkout sessions
  if (stripeEvent.type !== 'checkout.session.completed') {
    return json(200, { ok: true, ignored: true })
  }

  const session = stripeEvent.data.object
  const meta = session?.metadata || {}

  // FINAL LOCK: require an explicit action marker
  // (set this in your checkout creation: metadata.tkfm_action='feature_mixtape')
  const action = cleanStr(meta.tkfm_action || meta.type).toLowerCase()
  if (action && action !== 'feature_mixtape' && action !== 'feature') {
    return json(200, { ok: true, ignored: true })
  }

  // Require paid (prevents fulfilling unpaid sessions)
  const paymentStatus = cleanStr(session.payment_status).toLowerCase()
  if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') {
    return json(200, { ok: true, ignored: true, reason: 'not_paid' })
  }

  // Idempotency: ignore Stripe retries
  const processed = (await getStore('stripe_feature_events')) || []
  if (!Array.isArray(processed)) return json(500, { error: 'Store shape invalid' })
  if (processed.includes(stripeEvent.id)) {
    return json(200, { ok: true, duplicate: true })
  }

  const mixtapeId = cleanStr(meta.mixtapeId)
  const tier = cleanStr(meta.tier).toLowerCase()

  if (!mixtapeId || !DAYS[tier]) {
    return json(400, { error: 'Invalid metadata' })
  }

  const mixtapes = (await getStore('mixtapes')) || []
  if (!Array.isArray(mixtapes)) return json(500, { error: 'Store shape invalid' })

  const mixtape = mixtapes.find(m => m && m.id === mixtapeId)
  if (!mixtape) return json(404, { error: 'Mixtape not found' })

  const now = Date.now()
  const expires = now + DAYS[tier] * 86400000

  // Fulfill
  mixtape.featured = true
  mixtape.featureTier = tier
  mixtape.featureExpiresAt = expires
  mixtape.homepagePin = tier === 'elite'
  mixtape.lastStripeCheckoutSessionId = cleanStr(session.id) || null
  mixtape.lastStripePaymentStatus = paymentStatus || null
  mixtape.featuredAt = now

  await setStore('mixtapes', mixtapes)

  // Record processed event id (cap list)
  processed.unshift(stripeEvent.id)
  if (processed.length > 500) processed.length = 500
  await setStore('stripe_feature_events', processed)

  return json(200, { ok: true, upgraded: true, mixtapeId, tier })
}
