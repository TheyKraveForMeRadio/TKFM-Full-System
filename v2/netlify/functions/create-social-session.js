import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY

if (!stripeSecret) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set – create-social-session will fail until you add it.')
}

const stripe = stripeSecret ? new Stripe(stripeSecret) : null

const TIER_ENV_MAP = {
  starter: 'STRIPE_PRICE_SOCIAL_STARTER',
  motion: 'STRIPE_PRICE_SOCIAL_MOTION',
  takeover: 'STRIPE_PRICE_SOCIAL_TAKEOVER'
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

  let tier = 'starter'
  let role = 'artist'
  let priceFromClient = 0

  try {
    const body = JSON.parse(event.body || '{}')
    if (body.tier) tier = String(body.tier).toLowerCase()
    if (body.role) role = String(body.role).toLowerCase()
    if (body.price) priceFromClient = Number(body.price) || 0
  } catch (err) {
    console.warn('create-social-session: bad JSON body', err)
    return json(400, { error: 'Invalid JSON body' })
  }

  if (!Object.prototype.hasOwnProperty.call(TIER_ENV_MAP, tier)) {
    return json(400, { error: 'Unknown social tier', tier })
  }

  const envKey = TIER_ENV_MAP[tier]
  const priceId = process.env[envKey]

  if (!priceId) {
    console.warn(`create-social-session: missing env ${envKey}`)
    return json(500, {
      error: 'Price not configured for this tier on server',
      missingEnv: envKey
    })
  }

  const successUrl =
    process.env.STRIPE_SUCCESS_URL_SOCIAL ||
    process.env.STRIPE_SUCCESS_URL ||
    'http://localhost:8888/social-success.html'

  const cancelUrl =
    process.env.STRIPE_CANCEL_URL_SOCIAL ||
    process.env.STRIPE_CANCEL_URL ||
    'http://localhost:8888/social-cancel.html'

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
        source: 'tkfm_social_engine',
        tier,
        role,
        client_price: priceFromClient ? String(priceFromClient) : ''
      }
    })

    return json(200, { url: session.url })
  } catch (err) {
    console.error('create-social-session: Stripe error', err)
    return json(500, {
      error: 'Stripe checkout session creation failed',
      message: err.message
    })
  }
}
