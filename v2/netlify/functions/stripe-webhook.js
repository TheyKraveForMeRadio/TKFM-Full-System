import Stripe from 'stripe'
import { getStore, setStore } from './_helpers.js'

const stripeSecret = process.env.STRIPE_SECRET_KEY

if (!stripeSecret) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set – stripe-webhook will not be able to talk to Stripe for expands.')
}

const stripe = stripeSecret ? new Stripe(stripeSecret) : null

// Optional: if you add STRIPE_WEBHOOK_SECRET, you can turn on signature verification later.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || null

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }
}

// ---- helpers to touch your JSON stores via _helpers.js ----

async function appendToStore(key, record) {
  const existing = (await getStore(key)) || []
  if (!Array.isArray(existing)) {
    console.warn('Expected array store for', key, 'but got', typeof existing)
    return
  }
  existing.push(record)
  await setStore(key, existing)
}

// SOCIAL ENGINE (creator side) → tkfm_social_campaigns_server
async function handleSocialSession(session) {
  const md = session.metadata || {}
  const tier = (md.tier || 'starter').toLowerCase()
  const role = (md.role || 'artist').toLowerCase()
  const clientPrice = Number(md.client_price || 0)
  const amount = typeof session.amount_total === 'number'
    ? session.amount_total / 100
    : clientPrice

  const record = {
    id: 'social_' + session.id,
    sessionId: session.id,
    stripeCustomer: session.customer || null,
    tier,
    role,
    amount,
    currency: session.currency || 'usd',
    source: 'tkfm_social_engine',
    createdAt: Date.now(),
    stripeCreated: session.created ? session.created * 1000 : null,
    status: 'paid'
  }

  await appendToStore('tkfm_social_campaigns_server', record)
}

// LABEL SPONSOR ENGINE → tkfm_label_sponsor_orders_server
async function handleSponsorSession(session) {
  const md = session.metadata || {}
  const tier = (md.tier || 'starter_sponsor').toLowerCase()
  const clientPrice = Number(md.client_price || 0)
  const amount = typeof session.amount_total === 'number'
    ? session.amount_total / 100
    : clientPrice

  const record = {
    id: 'sponsor_' + session.id,
    sessionId: session.id,
    stripeCustomer: session.customer || null,
    tier,
    amount,
    currency: session.currency || 'usd',
    source: 'tkfm_label_sponsor_engine',
    createdAt: Date.now(),
    stripeCreated: session.created ? session.created * 1000 : null,
    status: 'paid'
  }

  await appendToStore('tkfm_label_sponsor_orders_server', record)
}

// (Optional) Mixtape Hosting hook stub – you can expand later
async function handleGenericSession(session) {
  // This is where you can later wire mixtape orders, creator-pass, etc.
  // For now we just log a generic record so nothing is lost.
  const md = session.metadata || {}
  const amount = typeof session.amount_total === 'number'
    ? session.amount_total / 100
    : 0

  const record = {
    id: 'generic_' + session.id,
    sessionId: session.id,
    stripeCustomer: session.customer || null,
    amount,
    currency: session.currency || 'usd',
    metadata: md,
    source: md.source || 'unknown',
    createdAt: Date.now(),
    stripeCreated: session.created ? session.created * 1000 : null,
    status: 'paid'
  }

  await appendToStore('tkfm_stripe_generic_log', record)
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  let stripeEvent

  // For now: parse JSON directly.
  // If you later set STRIPE_WEBHOOK_SECRET, you can switch to signature verification.
  try {
    if (webhookSecret && stripe) {
      // OPTIONAL: strict verification mode
      const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
      const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body

      stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } else {
      // Soft mode: trust the JSON (good enough while you're building)
      stripeEvent = JSON.parse(event.body || '{}')
    }
  } catch (err) {
    console.error('stripe-webhook: failed to parse/verify event', err)
    return json(400, { error: 'Invalid Stripe webhook payload', message: err.message })
  }

  const type = stripeEvent.type
  const data = stripeEvent.data || {}
  const session = data.object || {}

  if (type !== 'checkout.session.completed') {
    // Ignore everything else for now.
    return json(200, { ok: true, skipped: type })
  }

  const md = session.metadata || {}
  const source = (md.source || '').toLowerCase()

  try {
    if (source === 'tkfm_social_engine') {
      await handleSocialSession(session)
    } else if (source === 'tkfm_label_sponsor_engine') {
      await handleSponsorSession(session)
    } else {
      await handleGenericSession(session)
    }

    return json(200, { ok: true })
  } catch (err) {
    console.error('stripe-webhook: handler error', err)
    return json(500, { error: 'Failed to process webhook', message: err.message })
  }
}
