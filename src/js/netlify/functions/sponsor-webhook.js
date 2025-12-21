import Stripe from 'stripe'
import { getStore, setStore } from './_helpers.js'
import { v4 as uuidv4 } from 'uuid'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function handler(event) {
  const sig = event.headers['stripe-signature']

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return { statusCode: 400, body: 'Webhook Error' }
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object
    const sponsors = await getStore('sponsors')

    sponsors.unshift({
      id: uuidv4(),
      name: session.metadata.name,
      logoUrl: session.metadata.logoUrl,
      link: session.metadata.link,
      tier: session.metadata.tier,
      impressions: 0,
      active: true,
      stripeSubId: session.subscription,
      createdAt: Date.now()
    })

    await setStore('sponsors', sponsors)
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const subId = stripeEvent.data.object.id
    const sponsors = await getStore('sponsors')

    sponsors.forEach(s => {
      if (s.stripeSubId === subId) s.active = false
    })

    await setStore('sponsors', sponsors)
  }

  return { statusCode: 200, body: 'OK' }
}
