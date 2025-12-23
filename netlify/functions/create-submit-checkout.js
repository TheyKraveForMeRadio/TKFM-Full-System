// netlify/functions/create-submit-checkout.js — ENTERPRISE LOCKED (TIER-ONLY)
import Stripe from 'stripe'
import { preflight, json, safeParse, safeUrl, safeString, getClientIp } from './_helpers.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

function env(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function priceForTier(tier) {
  const t = String(tier || '').toLowerCase().trim()
  if (t === 'basic') return process.env.STRIPE_PRICE_SUBMIT_BASIC
  if (t === 'spotlight') return process.env.STRIPE_PRICE_SUBMIT_SPOTLIGHT
  if (t === 'boost') return process.env.STRIPE_PRICE_SUBMIT_BOOST
  return null
}

function safeSuccessCancel(url, siteUrl) {
  if (typeof url !== 'string' || !url.trim()) return null
  const s = url.trim()

  // allow relative paths like "/success.html"
  if (s.startsWith('/')) return siteUrl.replace(/\/$/, '') + s

  // allow absolute https
  return safeUrl(s) || null
}

export const handler = async (event) => {
  const pf = preflight(event)
  if (pf) return pf

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  // Config lock
  try {
    env('STRIPE_SECRET_KEY')
    env('SITE_URL')
    env('STRIPE_PRICE_SUBMIT_BASIC')
    env('STRIPE_PRICE_SUBMIT_SPOTLIGHT')
    env('STRIPE_PRICE_SUBMIT_BOOST')
  } catch {
    return json(500, { error: 'Server not configured' })
  }

  const ip = getClientIp(event)

  const body = safeParse(event.body, 50_000)
  if (!body) return json(400, { error: 'Invalid JSON' })

  const tier = safeString(body.tier, 3, 20).toLowerCase()
  const priceId = priceForTier(tier)
  if (!priceId) return json(400, { error: 'Invalid tier (use basic|spotlight|boost)' })

  const SITE_URL = process.env.SITE_URL.trim()
  const successUrl =
    safeSuccessCancel(body.successUrl, SITE_URL) || (SITE_URL.replace(/\/$/, '') + '/success.html')
  const cancelUrl =
    safeSuccessCancel(body.cancelUrl, SITE_URL) || (SITE_URL.replace(/\/$/, '') + '/submit.html')

  const email = safeString(body.email, 0, 120) || null

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email || undefined,
      metadata: {
        source: 'tkfm',
        type: 'submission',
        tier,
        ip: ip || '',
      },
    })

    return json(200, { ok: true, url: session.url })
  } catch (err) {
    console.error('create-submit-checkout error:', err?.message || err)
    return json(500, { error: 'Checkout failed' })
  }
}

