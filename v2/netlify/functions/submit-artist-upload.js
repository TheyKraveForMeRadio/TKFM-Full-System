import { getStore, setStore } from './_helpers.js'

function makeId() {
  const base = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `upl_${base}_${rand}`
}

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

    const {
      role,
      artistName,
      email,
      instagram,
      phone,
      projectTitle,
      projectType,
      primaryLink,
      secondaryLink,
      epkLink,
      notes,
      desiredSupport,
      sourcePage
    } = body

    if (!artistName || !email || !primaryLink) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'missing-fields',
          message: 'artistName, email, and primaryLink are required'
        })
      }
    }

    const uploads = (await getStore('artistUploads')) || []

    const now = new Date().toISOString()
    const record = {
      id: makeId(),
      createdAt: now,
      updatedAt: now,
      role: role || 'artist',
      artistName,
      email,
      instagram: instagram || '',
      phone: phone || '',
      projectTitle: projectTitle || '',
      projectType: projectType || '',
      primaryLink,
      secondaryLink: secondaryLink || '',
      epkLink: epkLink || '',
      notes: notes || '',
      desiredSupport: desiredSupport || '',
      sourcePage: sourcePage || 'artist-upload.html',
      status: 'new' // label-review, accepted, rejected, archived later
    }

    uploads.push(record)
    await setStore('artistUploads', uploads)

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true, record })
    }
  } catch (err) {
    console.error('submit-artist-upload error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
