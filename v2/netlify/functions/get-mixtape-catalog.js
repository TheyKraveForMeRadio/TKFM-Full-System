import { getStore } from './_helpers.js'

export async function handler(event) {
  try {
    const params = event.queryStringParameters || {}
    const tierFilter = params.tier || ''
    const statusFilter = params.orderStatus || ''
    const search = (params.q || '').toLowerCase()

    const catalog = (await getStore('mixtapeCatalog')) || []

    let result = catalog.slice()

    if (tierFilter && tierFilter !== 'all') {
      result = result.filter(item => (item.tier || '') === tierFilter)
    }

    if (statusFilter && statusFilter !== 'all') {
      result = result.filter(item => (item.orderStatus || '') === statusFilter)
    }

    if (search) {
      result = result.filter(item => {
        const blob = [
          item.artistName,
          item.projectTitle,
          item.email,
          item.source,
          item.notes
        ].join(' ').toLowerCase()
        return blob.includes(search)
      })
    }

    // newest first
    result.sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || 0).getTime()
      const db = new Date(b.updatedAt || b.createdAt || 0).getTime()
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
    console.error('get-mixtape-catalog error:', err)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
