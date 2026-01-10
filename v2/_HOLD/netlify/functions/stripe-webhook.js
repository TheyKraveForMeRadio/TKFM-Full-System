import Stripe from 'stripe'
import { getStore, setStore } from './_helpers.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export async function handler(event) {
  const sig = event.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let stripeEvent

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    if (
      stripeEvent.type === 'checkout.session.completed' ||
      stripeEvent.type === 'invoice.payment_succeeded'
    ) {
      let session
      let subscription

      if (stripeEvent.type === 'checkout.session.completed') {
        session = stripeEvent.data.object
        if (session.subscription) {
          subscription = await stripe.subscriptions.retrieve(session.subscription)
        }
      } else {
        const invoice = stripeEvent.data.object
        if (invoice.subscription) {
          subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        }
        session = { metadata: subscription?.metadata || {} }
      }

      const metadata = session.metadata || subscription?.metadata || {}
      const labelId = metadata.labelId

      if (!labelId) {
        console.warn('No labelId on metadata; skipping label sync.')
      } else {
        const labels = (await getStore('labels')) || []
        const label = labels.find(l => l.id === labelId)

        if (label) {
          label.stripeStatus = 'active'
          label.updatedAt = new Date().toISOString()
          if (session.customer) label.stripeCustomerId = session.customer
          if (subscription) label.stripeSubscriptionId = subscription.id

          await setStore('labels', labels)
        } else {
          console.warn('Label not found for labelId', labelId)
        }
      }
    }

    return { statusCode: 200, body: 'ok' }
  } catch (err) {
    console.error('stripe-webhook handler error', err)
    return { statusCode: 500, body: 'Webhook internal error' }
  }
}
