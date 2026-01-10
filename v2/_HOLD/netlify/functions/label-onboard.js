import Stripe from 'stripe'
import { getStore, setStore } from './_helpers.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

/**
 * Map frontend plan keys -> Stripe lookup_key
 * Replace these strings with the actual lookup_keys you already use.
 */
const PLAN_LOOKUP_KEYS = {
  label_lite: 'tkfm_label_lite_monthly',
  label_pro: 'tkfm_label_pro_monthly',
  label_empire: 'tkfm_label_empire_monthly',
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const {
      planKey,
      labelName,
      contactName,
      email,
      social,
      rosterSize,
      goals,
    } = body

    if (!planKey || !PLAN_LOOKUP_KEYS[planKey]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid or missing plan.' }),
      }
    }

    if (!labelName || !contactName || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields.' }),
      }
    }

    const labels = (await getStore('labels')) || []

    const labelId = `lbl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()

    const newLabel = {
      id: labelId,
      planKey,
      stripeStatus: 'pending_payment',
      labelName,
      contactName,
      email,
      social: social || null,
      rosterSize: rosterSize ? Number(rosterSize) : null,
      goals: goals || null,
      createdAt: now,
      updatedAt: now,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      notes: [],
    }

    labels.push(newLabel)
    await setStore('labels', labels)

    // Get Stripe price by lookup_key
    const lookupKey = PLAN_LOOKUP_KEYS[planKey]
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      limit: 1,
      expand: ['data.product'],
    })

    if (!prices.data.length) {
      console.error('No price found for', lookupKey)
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Stripe price not found.' }),
      }
    }

    const price = prices.data[0]

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        labelId,
        planKey,
        labelName,
        contactName,
      },
      subscription_data: {
        metadata: {
          labelId,
          planKey,
        },
      },
      success_url: `${process.env.SITE_URL || 'https://tkfmradio.com'}/label-success?label=${labelId}`,
      cancel_url: `${process.env.SITE_URL || 'https://tkfmradio.com'}/label-cancel?label=${labelId}`,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        checkoutUrl: session.url,
        labelId,
      }),
    }
  } catch (err) {
    console.error('label-onboard error', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal error starting onboarding.' }),
    }
  }
}
