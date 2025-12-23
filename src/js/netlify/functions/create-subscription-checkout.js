import Stripe from 'stripe'
import { verifyDJ } from './_helpers.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
})

// 🔒 LOCKED DJ SUBSCRIPTION TIERS
const DJ_SUBSCRIPTIONS = {
  basic: process.env.STRIPE_PRICE_DJ_BASIC,
  pro: process.env.STRIPE_PRICE_DJ_PRO,
  elite: process.env.STRIPE_PRICE_DJ_ELITE
}

export async function handler(event) {
  try {
    // 🔐 VERIFY DJ AUTH
    const dj = verifyDJ(event)
    if (!dj) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: 'Unauthorized' })
      }
    }

    const body = JSON.parse(event.body || '{}')
    const { tier } = body

    if (!DJ_SUBSCRIPTIONS[tier]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Invalid subscription tier' })
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: dj.email, // 🔒 server-trusted
      line_items: [
        {
          price: DJ_SUBSCRIPTIONS[tier],
          quantity: 1
        }
      ],
      metadata: {
        type: 'dj-subscription',
        tier,
        djId: dj.id,
        djEmail: dj.email
      },
      success_url: `${process.env.SITE_DOMAIN}/dj.html?sub=success`,
      cancel_url: `${process.env.SITE_DOMAIN}/dj.html?sub=cancel`
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, url: session.url })
    }

  } catch (err) {
    console.error('DJ subscription checkout error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'Subscription checkout failed' })
    }
  }
}
