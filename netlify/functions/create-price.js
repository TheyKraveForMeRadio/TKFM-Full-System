import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  }
}

function safeParse(body) {
  if (!body || typeof body !== 'string') return null
  try { return JSON.parse(body) } catch { return null }
}

function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : h.trim()
}

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  // Config lock
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'Server not configured' })
  if (!process.env.ADMIN_TOKEN) return json(500, { error: 'Server not configured' })

  // Admin auth
  const token = getBearer(event)
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return json(401, { error: 'Unauthorized' })
  }

  const body = safeParse(event.body)
  if (!body) return json(400, { error: 'Invalid JSON' })

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const price = Number(body.price)

  // Validation bounds (FINAL LOCK)
  if (!title || title.length < 3 || title.length > 80) {
    return json(400, { error: 'Invalid title' })
  }

  // Example bounds: $1 to $9999 (adjust if needed)
  if (!Number.isFinite(price) || price < 1 || price > 9999) {
    return json(400, { error: 'Invalid price' })
  }

  const unitAmount = Math.round(price * 100)

  try {
    const product = await stripe.products.create({
      name: title,
      metadata: { source: 'tkfm' },
    })

    const priceObj = await stripe.prices.create({
      unit_amount: unitAmount,
      currency: 'usd',
      product: product.id,
    })

    return json(200, { productId: product.id, priceId: priceObj.id })
  } catch {
    // No error detail leakage
    return json(500, { error: 'Stripe product/price creation failed' })
  }
}
