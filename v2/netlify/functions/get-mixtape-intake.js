import { getStore } from './_helpers.js'

export async function handler(event) {
  try {
    const params = event.queryStringParameters || {}

    // default: only show pending-intake
    const statusFilter = params.status || 'pending-intake'

    const storeName = 'mixtapeOrders'
    const orders = (await getStore(storeName)) || []

    const filtered =
      statusFilter === 'all'
        ? orders
        : orders.filter(o => (o.status || 'pending-intake') === statusFilter)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(filtered)
    }
  } catch (err) {
    console.error('get-mixtape-intake error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
