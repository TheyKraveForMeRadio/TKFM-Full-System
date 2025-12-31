import { getStore } from './_helpers.js'

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  }

  try {
    const params = event.queryStringParameters || {}
    const statusFilter = params.status || '' // 'new', 'label-review', etc.
    const roleFilter = params.role || ''     // 'artist', 'dj', 'producer', 'label'

    let uploads = (await getStore('artistUploads')) || []

    if (statusFilter && statusFilter !== 'all') {
      uploads = uploads.filter(u => (u.status || 'new') === statusFilter)
    }

    if (roleFilter && roleFilter !== 'all') {
      uploads = uploads.filter(u => (u.role || 'artist') === roleFilter)
    }

    uploads.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return db - da
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(uploads)
    }
  } catch (err) {
    console.error('get-artist-uploads error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
