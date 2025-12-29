import { getStore, setStore } from './_helpers.js'

const ALLOWED_STATUSES = [
  'new',
  'label-review',
  'accepted',
  'rejected',
  'archived'
]

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
    const { id, status, labelNotes } = body

    if (!id || !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'missing-fields',
          message: 'id and status are required'
        })
      }
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'invalid-status',
          message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
        })
      }
    }

    const uploads = (await getStore('artistUploads')) || []
    const idx = uploads.findIndex(u => u.id === id)

    if (idx === -1) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'not-found' })
      }
    }

    const now = new Date().toISOString()

    uploads[idx].status = status
    uploads[idx].updatedAt = now
    if (typeof labelNotes === 'string') {
      uploads[idx].labelNotes = labelNotes
    }

    await setStore('artistUploads', uploads)

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        record: uploads[idx]
      })
    }
  } catch (err) {
    console.error('update-artist-upload-status error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
