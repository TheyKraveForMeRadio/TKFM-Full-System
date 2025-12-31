import Stripe from 'stripe'
import { getStore, setStore } from './_helpers.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function handler(event) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const sig =
    event.headers['stripe-signature'] ||
    event.headers['Stripe-Signature'] ||
    event.headers['STRIPE_SIGNATURE']

  if (!webhookSecret || !sig) {
    return { statusCode: 400, body: 'missing-webhook-config' }
  }

  let stripeEvent
  try {
    // Handle possible base64 encoding from Netlify
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body

    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  // Only care about completed checkout sessions
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'ignored-event' }
  }

  const session = stripeEvent.data.object

  if (session.payment_status !== 'paid') {
    return { statusCode: 200, body: 'not-paid' }
  }

  const tier = session.metadata?.tier || 'unknown'
  const product = session.metadata?.product || 'mixtape_unknown'
  const email =
    session.customer_details?.email ||
    session.customer_email ||
    'unknown'
  const name = session.customer_details?.name || 'Unknown Artist'

  const amount_total = session.amount_total || 0
  const currency = session.currency || 'usd'

  // This store becomes your Autopilot + Label intake queue
  const storeName = 'mixtapeOrders'
  const orders = (await getStore(storeName)) || []

  const record = {
    id: session.id,
    createdAt: new Date().toISOString(),
    tier,
    product,
    email,
    name,
    amount_total,
    currency,
    status: 'pending-intake', // Autopilot/Label can flip this
    source: 'mixtape-hosting',
    StripeSessionURL: session.url || null
  }

  orders.push(record)
  await setStore(storeName, orders)

  console.log('New mixtape order stored:', record)

  return { statusCode: 200, body: 'mixtape-order-recorded' }
}
