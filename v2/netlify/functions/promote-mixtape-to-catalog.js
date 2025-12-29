import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
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
    const { orderId } = body

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: 'missing-orderId'
      }
    }

    const orders = (await getStore('mixtapeOrders')) || []
    const briefs = (await getStore('mixtapeBriefs')) || []

    const order = orders.find(o => o.id === orderId)
    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: 'order-not-found'
      }
    }

    // Join brief: by sessionId (preferred) then by email+projectTitle
    let brief =
      briefs.find(b => b.sessionId && b.sessionId === order.id) || null

    if (!brief) {
      const email = (order.email || order.customer_email || '').toLowerCase()
      const projectTitle = (order.projectTitle || '').toLowerCase()
      const key = email + '|' + projectTitle
      brief = briefs.find(b =>
        ((b.email || '').toLowerCase() + '|' + (b.projectTitle || '').toLowerCase()) === key
      ) || null
    }

    const catalog = (await getStore('mixtapeCatalog')) || []

    const artistName = brief?.artistName || order.name || 'Unknown Artist'
    const email = brief?.email || order.email || order.customer_email || 'unknown'
    const projectTitle = brief?.projectTitle || order.projectTitle || ''
    const tier = brief?.tier || order.tier || ''
    const links = brief?.links || ''
    const notes = brief?.notes || ''
    const amount_total = order.amount_total || 0
    const currency = order.currency || 'usd'
    const source = order.source || 'mixtape-hosting'
    const status = order.status || 'pending-intake'

    const existingIdx = catalog.findIndex(c => c.id === order.id)

    const record = {
      id: order.id,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      artistName,
      email,
      projectTitle,
      tier,
      amount_total,
      currency,
      source,
      orderStatus: status,
      links,
      notes
    }

    if (existingIdx === -1) {
      catalog.push(record)
    } else {
      catalog[existingIdx] = record
    }

    await setStore('mixtapeCatalog', catalog)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ ok: true, record })
    }
  } catch (err) {
    console.error('promote-mixtape-to-catalog error:', err)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'server-error'
    }
  }
}
