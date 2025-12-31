import { getStore } from './_helpers.js'

function sumAmounts(list) {
  return list.reduce((acc, item) => acc + (item.amount_total || 0), 0)
}

function countBy(list, key) {
  const out = {}
  for (const item of list) {
    const k = (item[key] || 'unknown').toString()
    out[k] = (out[k] || 0) + 1
  }
  return out
}

export async function handler() {
  try {
    const orders = (await getStore('mixtapeOrders')) || []
    const catalog = (await getStore('mixtapeCatalog')) || []

    const now = new Date().toISOString()

    const ordersByStatus = countBy(orders, 'status')
    const catalogByTier = countBy(catalog, 'tier')
    const catalogByStatus = countBy(catalog, 'orderStatus')

    const totalOrderAmount = sumAmounts(orders)
    const completedOrderAmount = sumAmounts(
      orders.filter(o => o.status === 'completed')
    )

    const latestOrder = orders
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )[0] || null

    const latestCatalog = catalog
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      )[0] || null

    const summary = {
      generatedAt: now,
      orders: {
        total: orders.length,
        byStatus: ordersByStatus,
        totalAmount: totalOrderAmount,
        completedAmount: completedOrderAmount,
        lastOrder: latestOrder
          ? {
              id: latestOrder.id,
              artistName: latestOrder.name,
              status: latestOrder.status || 'unknown',
              amount_total: latestOrder.amount_total || 0,
              currency: latestOrder.currency || 'usd',
              createdAt: latestOrder.createdAt || null
            }
          : null
      },
      catalog: {
        total: catalog.length,
        byTier: catalogByTier,
        byStatus: catalogByStatus,
        lastEntry: latestCatalog
          ? {
              id: latestCatalog.id,
              artistName: latestCatalog.artistName,
              projectTitle: latestCatalog.projectTitle,
              tier: latestCatalog.tier,
              orderStatus: latestCatalog.orderStatus,
              updatedAt: latestCatalog.updatedAt || latestCatalog.createdAt || null
            }
          : null
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(summary)
    }
  } catch (err) {
    console.error('get-label-overview error:', err)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
