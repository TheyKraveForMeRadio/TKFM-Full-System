// netlify/functions/create-submit-checkout.js — ENTERPRISE LOCKED
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  }
}

function safeParse(body) {
  if (!body || typeof body !== 'string') return null
  if (body.length > 20_000) return null
  try { return JSON.parse(body) } catch { return null }
}

function cleanStr(v, max = 600) {
  const s = String(v || '').trim()
  return s.length > max ? s.slice(0, max) : s
}

function getOrigin(event) {
  const envSite = (process.env.SITE_URL || process.env.URL || '').trim()
  if (envSite) return envSite.replace(/\/+$/, '')
  const h = event.headers || {}
  const o = h.origin || h.Origin
  return typeof o === 'string' ? o.replace(/\/+$/, '') : ''
}

function isAllowedReturnUrl(urlStr, origin) {
  try {
    const u = new URL(urlStr)
    const o = new URL(origin)
    return u.origin === o.origin
  } catch {
    return false
  }
}

function getIP(event) {
  const h = event.headers || {}
  const ip =
    h['x-nf-client-connection-ip'] ||
    (typeof h['x-forwarded-for'] === 'string' ? h['x-forwarded-for'].split(',')[0].trim() : '') ||
    ''
  return ip || 'unknown'
}

// Best-effort in-memory rate limit (per warm instance)
const RL = globalThis.__tkfm_submit_rl || (globalThis.__tkfm_submit_rl = new Map())
function rateLimit(ip) {
  const now = Date.now()
  const windowMs = 60_000 // 1 minute
  const max = 15

  const entry = RL.get(ip) || { count: 0, resetAt: now + windowMs }
  if (now > entry.resetAt) {
    entry.count = 0
    entry.resetAt = now + windowMs
  }
  entry.count += 1
  RL.set(ip, entry)

  if (entry.count > max) {
    const err = new Error('Rate limited')
    err.statusCode = 429
    throw err
  }
}

const PLAN_TO_PRICE_ENV = {
  SUBMIT_BASIC: 'STRIPE_PRICE_SUBMIT_BASIC',
  SUBMIT_SPOTLIGHT: 'STRIPE_PRICE_SUBMIT_SPOTLIGHT',
  SUBMIT_BOOST: 'STRIPE_PRICE_SUBMIT_BOOST',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  try {
    if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'Stripe not configured' })

    const ip = getIP(event)
    rateLimit(ip)

    const origin = getOrigin(event)
    if (!origin) return json(500, { error: 'Site URL not configured' })

    const payload = safeParse(event.body)
    if (!payload) return json(400, { error: 'Invalid JSON' })

    const plan = cleanStr(payload.plan, 40).toUpperCase()
    const priceEnv = PLAN_TO_PRICE_ENV[plan]
    const priceId = priceEnv ? cleanStr(process.env[priceEnv], 200) : ''

    if (!priceId) return json(400, { error: 'Invalid plan' })

    const successUrl = cleanStr(payload.successUrl, 600) || `${origin}/success.html`
    const cancelUrl = cleanStr(payload.cancelUrl, 600) || `${origin}/submit.html`

    if (!isAllowedReturnUrl(successUrl, origin) || !isAllowedReturnUrl(cancelUrl, origin)) {
      return json(400, { error: 'Invalid return URL' })
    }

    // Optional: allow collecting email from frontend
    const customerEmail = payload.email ? cleanStr(payload.email, 120) : null

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      allow_promotion_codes: true,

      metadata: {
        type: 'music_submission',
        plan,
        source: 'submit-page',
      },
    })

    return json(200, { ok: true, url: session.url, sessionId: session.id })
  } catch (err) {
    return json(err.statusCode || 500, { error: err.message || 'Checkout failed' })
  }
}
