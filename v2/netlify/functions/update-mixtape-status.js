import { getStore, setStore } from './_helpers.js'

const ALLOWED_STATUSES = [
  'pending-intake',
  'approved',
  'rejected',
  'in-contract',
  'completed'
]

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Allow': 'POST',
        'Access-Control-Allow-Origin': '*'
      },
      body: 'Method Not Allowed'
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { id, status, notes } = body

    if (!id || !status) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: 'missing-id-or-status'
      }
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: 'invalid-status'
      }
    }

    const storeName = 'mixtapeOrders'
    const orders = (await getStore(storeName)) || []

    const idx = orders.findIndex(o => o.id === id)
    if (idx === -1) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: 'order-not-found'
      }
    }

    const now = new Date().toISOString()

    orders[idx].status = status
    orders[idx].updatedAt = now

    if (notes) {
      orders[idx].notes = notes
    }

    await setStore(storeName, orders)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ ok: true, order: orders[idx] })
    }
  } catch (err) {
    console.error('update-mixtape-status error:', err)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'server-error'
    }
  }
}
