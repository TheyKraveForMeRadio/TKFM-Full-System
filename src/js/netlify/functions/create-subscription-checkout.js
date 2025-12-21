import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function handler(event) {
  const { priceId, djEmail } = JSON.parse(event.body)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: djEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'https://www.tkfmradio.com/dj?sub=success',
    cancel_url: 'https://www.tkfmradio.com/dj?sub=cancel'
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url })
  }
}
