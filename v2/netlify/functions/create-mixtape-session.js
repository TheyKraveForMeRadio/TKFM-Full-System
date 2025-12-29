import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRODUCTS = {
  starter: 'price_mixtape_starter', // $500
  pro:     'price_mixtape_pro',     // $1000
  elite:   'price_mixtape_elite'    // $2500
}

export async function handler(event) {
  try {
    const { tier } = JSON.parse(event.body || '{}')
    const price = PRODUCTS[tier]
    if (!price) {
      return {
        statusCode: 400,
        body: 'invalid-tier'
      }
    }

    // IMPORTANT:
    // success_url sends artist to Mixtape Brief page
    const baseUrl = process.env.SITE_URL || 'https://YOURDOMAIN.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price, quantity: 1 }],
      success_url: `${baseUrl}/mixtape-brief.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dj-mixtape-hosting.html`,
      metadata: { product: `mixtape_${tier}`, tier }
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    }
  } catch (err) {
    console.error('create-mixtape-session error:', err)
    return {
      statusCode: 500,
      body: err.toString()
    }
  }
}
