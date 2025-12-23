import Stripe from 'stripe'
import { verifyDJ, getStore } from './_helpers.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
})

const PRICES = {
  basic: process.env.STRIPE_PRICE_FEATURE_BASIC,
  pro: process.env.STRIPE_PRICE_FEATURE_PRO,
  elite: process.env.STRIPE_PRICE_FEATURE_ELITE
}

export async function handler(event) {
  try {
    // 🔐 AUTH — HARD BLOCK
    const user = verifyDJ(event)
    if (!user || !user.id) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: 'Unauthorized' })
      }
    }

    // 📦 INPUT
    const body = JSON.parse(event.body || '{}')
    const tier = (body.tier || '').toLowerCase()
    const mixtapeId = body.mixtapeId

    if (!mixtapeId || !PRICES[tier]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Invalid request' })
      }
    }

    // 📊 LOAD PLATFORM STATE (ANTI-SPOOF)
    const stats = (await getStore('stats')) || {}
    const surgeActive = stats.surgeActive === true

    // 🚫 SURGE LOCK — ELITE ONLY
    if (surgeActive && tier !== 'elite') {
      console.warn(`🚫 Surge lock: DJ ${user.id} blocked (${tier})`)
      return {
        statusCode: 403,
        body: JSON.stringify({
          ok: false,
          error: 'Lower tiers locked during surge',
          requiredTier: 'elite'
        })
      }
    }

    // 💳 STRIPE SESSION
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICES[tier],
          quantity: 1
        }
      ],
      metadata: {
        type: 'feature',
        mixtapeId,
        tier,
        djId: user.id
      },
      success_url: `${process.env.SITE_DOMAIN}/dj.html?feature=success&tier=${tier}`,
      cancel_url: `${process.env.SITE_DOMAIN}/dj.html?feature=cancel`
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, url: session.url })
    }

  } catch (err) {
    console.error('Stripe checkout error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'Checkout failed' })
    }
  }
}
