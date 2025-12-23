import Stripe from 'stripe'
import { verifyAdmin } from './_helpers.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
})

// 🔒 LOCKED SPONSOR TIERS
const SPONSOR_TIERS = {
  bronze: {
    price: process.env.STRIPE_PRICE_SPONSOR_BRONZE,
    views: 100
  },
  silver: {
    price: process.env.STRIPE_PRICE_SPONSOR_SILVER,
    views: 300
  },
  gold: {
    price: process.env.STRIPE_PRICE_SPONSOR_GOLD,
    views: 1000
  }
}

export async function handler(event) {
  try {
    // 🔐 ADMIN ONLY
    const admin = verifyAdmin(event)
    if (!admin) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: 'Unauthorized' })
      }
    }

    const body = JSON.parse(event.body || '{}')
    const { tier, name, link, logoUrl } = body

    if (!SPONSOR_TIERS[tier]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Invalid sponsor tier' })
      }
    }

    if (!name || !link) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Missing sponsor info' })
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: SPONSOR_TIERS[tier].price,
          quantity: 1
        }
      ],
      metadata: {
        type: 'sponsor',
        tier,
        name,
        link,
        logoUrl: logoUrl || '',
        maxViews: SPONSOR_TIERS[tier].views
      },
      success_url: `${process.env.SITE_DOMAIN}/sponsor-success.html`,
      cancel_url: `${process.env.SITE_DOMAIN}/sponsor-cancel.html`
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, url: session.url })
    }

  } catch (err) {
    console.error('Sponsor checkout error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'Sponsor checkout failed' })
    }
  }
}
