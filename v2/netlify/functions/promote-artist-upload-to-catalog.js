import { getStore, setStore } from './_helpers.js'

const ALLOWED_TIERS = ['starter', 'pro', 'elite']

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
    const { id, tier, orderStatus } = body

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

    let chosenTier = (tier || 'starter').toLowerCase()
    if (!ALLOWED_TIERS.includes(chosenTier)) {
      chosenTier = 'starter'
    }

    const chosenStatus = orderStatus || 'approved'

    const uploads = (await getStore('artistUploads')) || []
    const catalog = (await getStore('mixtapeCatalog')) || []

    const uploadIdx = uploads.findIndex(u => u.id === id)
    if (uploadIdx === -1) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'upload-not-found' })
      }
    }

    const upload = uploads[uploadIdx]

    const now = new Date().toISOString()

    // If already promoted, just refresh + return same record
    let existing = catalog.find(c => c.sourceUploadId === id)

    if (existing) {
      existing.updatedAt = now
      existing.tier = chosenTier
      existing.orderStatus = chosenStatus

      await setStore('mixtapeCatalog', catalog)

      uploads[uploadIdx].updatedAt = now
      uploads[uploadIdx].status = uploads[uploadIdx].status || 'accepted'
      uploads[uploadIdx].promotedCatalogId = existing.id
      await setStore('artistUploads', uploads)

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ok: true,
          record: existing,
          alreadyExisted: true
        })
      }
    }

    const baseId = `cat_${id}`
    let finalId = baseId
    let counter = 1
    while (catalog.some(c => c.id === finalId)) {
      finalId = `${baseId}_${counter++}`
    }

    const catalogRecord = {
      id: finalId,
      sourceUploadId: upload.id,
      createdAt: now,
      updatedAt: now,
      artistName: upload.artistName || '',
      projectTitle: upload.projectTitle || '',
      email: upload.email || '',
      tier: chosenTier,
      orderStatus: chosenStatus,
      amount_total: 0,
      currency: 'usd',
      source: 'artist-upload',
      notes: upload.notes || '',
      desiredSupport: upload.desiredSupport || '',
      role: upload.role || 'artist',
      links: upload.primaryLink || '',
      extraLinks: {
        primaryLink: upload.primaryLink || '',
        secondaryLink: upload.secondaryLink || '',
        epkLink: upload.epkLink || ''
      }
    }

    catalog.push(catalogRecord)
    await setStore('mixtapeCatalog', catalog)

    uploads[uploadIdx].status = uploads[uploadIdx].status || 'accepted'
    uploads[uploadIdx].updatedAt = now
    uploads[uploadIdx].promotedCatalogId = catalogRecord.id
    await setStore('artistUploads', uploads)

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        record: catalogRecord,
        alreadyExisted: false
      })
    }
  } catch (err) {
    console.error('promote-artist-upload-to-catalog error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
