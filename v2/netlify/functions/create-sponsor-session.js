import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY

if (!stripeSecret) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set – create-sponsor-session will fail until you add it.')
}

const stripe = stripeSecret ? new Stripe(stripeSecret) : null

const TIER_ENV_MAP = {
  starter_sponsor: 'STRIPE_PRICE_SPONSOR_STARTER',
  city_lock: 'STRIPE_PRICE_SPONSOR_CITY_LOCK',
  takeover_sponsor: 'STRIPE_PRICE_SPONSOR_TAKEOVER'
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(payload)
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' })
  }

  if (!stripe) {
    return json(500, { error: 'Stripe is not configured on the server' })
  }

  let tier = 'starter_sponsor'
  let priceFromClient = 0

  try {
    const body = JSON.parse(event.body || '{}')
    if (body.tier) tier = String(body.tier).toLowerCase()
    if (body.price) priceFromClient = Number(body.price) || 0
  } catch (err) {
    console.warn('create-sponsor-session: bad JSON body', err)
    return json(400, { error: 'Invalid JSON body' })
  }

  if (!Object.prototype.hasOwnProperty.call(TIER_ENV_MAP, tier)) {
    return json(400, { error: 'Unknown sponsor tier', tier })
  }

  const envKey = TIER_ENV_MAP[tier]
  const priceId = process.env[envKey]

  if (!priceId) {
    console.warn(`create-sponsor-session: missing env ${envKey}`)
    return json(500, {
      error: 'Price not configured for this tier on server',
      missingEnv: envKey
    })
  }

  const successUrl =
    process.env.STRIPE_SUCCESS_URL_SPONSOR ||
    process.env.STRIPE_SUCCESS_URL ||
    'http://localhost:8888/sponsor-success.html'

  const cancelUrl =
    process.env.STRIPE_CANCEL_URL_SPONSOR ||
    process.env.STRIPE_CANCEL_URL ||
    'http://localhost:8888/sponsor-cancel.html'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        source: 'tkfm_label_sponsor_engine',
        tier,
        client_price: priceFromClient ? String(priceFromClient) : ''
      }
    })

    return json(200, { url: session.url })
  } catch (err) {
    console.error('create-sponsor-session: Stripe error', err)
    return json(500, {
      error: 'Stripe checkout session creation failed',
      message: err.message
    })
  }
}
