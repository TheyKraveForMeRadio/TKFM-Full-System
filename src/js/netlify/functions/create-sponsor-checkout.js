import Stripe from 'stripe'
import { verifyDJ } from './_helpers.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
})

// 🔐 HARD-CODE ALLOWED SUBSCRIPTIONS
const SUBSCRIPTIONS = {
  basic: process.env.STRIPE_PRICE_SUB_BASIC,
  pro: process.env.STRIPE_PRICE_SUB_PRO,
  elite: process.env.STRIPE_PRICE_SUB_ELITE
}

export async function handler(event) {
  try {
    // 🔐 AUTH REQUIRED
    const user = verifyDJ(event)
    if (!user || !user.id) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: 'Unauthorized' })
      }
    }

    const body = JSON.parse(event.body || '{}')
    const tier = (body.tier || '').toLowerCase()

    if (!SUBSCRIPTIONS[tier]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Invalid subscription tier' })
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: SUBSCRIPTIONS[tier],
          quantity: 1
        }
      ],
      metadata: {
        type: 'subscription',
        tier,
        djId: user.id
      },
      success_url: `${process.env.SITE_DOMAIN}/dj.html?sub=success&tier=${tier}`,
      cancel_url: `${process.env.SITE_DOMAIN}/dj.html?sub=cancel`
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, url: session.url })
    }

  } catch (err) {
    console.error('Subscription checkout error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'Checkout failed' })
    }
  }
}
