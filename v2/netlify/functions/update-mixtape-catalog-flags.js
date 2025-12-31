import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'ok' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: 'Method Not Allowed'
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { id, autopilotEnabled, featured, labelNotes } = body

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'missing-id',
          message: 'id is required'
        })
      }
    }

    let catalog = (await getStore('mixtapeCatalog')) || []
    const idx = catalog.findIndex(item => item.id === id)

    if (idx === -1) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'not-found' })
      }
    }

    const now = new Date().toISOString()
    const item = catalog[idx]

    if (typeof autopilotEnabled === 'boolean') {
      item.autopilotEnabled = autopilotEnabled
    }
    if (typeof featured === 'boolean') {
      item.featured = featured
    }
    if (typeof labelNotes === 'string') {
      item.labelNotes = labelNotes
    }

    item.updatedAt = now

    catalog[idx] = item
    await setStore('mixtapeCatalog', catalog)

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true, record: item })
    }
  } catch (err) {
    console.error('update-mixtape-catalog-flags error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
