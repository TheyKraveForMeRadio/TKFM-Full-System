import { getStore } from './_helpers.js'

export async function handler(event) {
  try {
    const params = event.queryStringParameters || {}
    const statusFilter = params.status || 'pending-intake'
    const storeOrders = 'mixtapeOrders'
    const storeBriefs = 'mixtapeBriefs'

    const orders = (await getStore(storeOrders)) || []
    const briefs = (await getStore(storeBriefs)) || []

    // Index briefs by sessionId for tight join
    const briefBySessionId = {}
    for (const brief of briefs) {
      if (brief.sessionId) {
        briefBySessionId[brief.sessionId] = brief
      }
    }

    // Optional secondary index: by email+projectTitle (looser fallback)
    const briefByEmailProject = {}
    for (const brief of briefs) {
      const key = (brief.email || '').toLowerCase() + '|' +
        (brief.projectTitle || '').toLowerCase()
      if (key.trim() !== '|') {
        briefByEmailProject[key] = brief
      }
    }

    let result = orders.map(order => {
      let brief =
        briefBySessionId[order.id] ||
        briefByEmailProject[
          ((order.email || order.customer_email || '').toLowerCase()) +
          '|' +
          ((order.projectTitle || '').toLowerCase())
        ] ||
        null

      return {
        ...order,
        brief: brief || null
      }
    })

    if (statusFilter !== 'all') {
      result = result.filter(o => (o.status || 'pending-intake') === statusFilter)
    }

    // Sort newest first
    result.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return db - da
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    }
  } catch (err) {
    console.error('get-mixtape-label-view error:', err)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
