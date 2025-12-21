import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function handler(event) {
  const { priceId, successUrl, cancelUrl } = JSON.parse(event.body)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url })
  }
}
