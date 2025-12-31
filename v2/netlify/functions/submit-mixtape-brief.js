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
    const {
      sessionId,
      artistName,
      email,
      projectTitle,
      links,
      notes,
      tier
    } = body

    if (!artistName || !email || !projectTitle) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: 'missing-required-fields'
      }
    }

    const storeName = 'mixtapeBriefs'
    const briefs = (await getStore(storeName)) || []

    const record = {
      id: `brief_${Date.now()}`,
      sessionId: sessionId || null,
      createdAt: new Date().toISOString(),
      artistName,
      email,
      projectTitle,
      links: links || '',
      notes: notes || '',
      tier: tier || 'unknown',
      status: 'new',
      source: 'mixtape-hosting-brief'
    }

    briefs.push(record)
    await setStore(storeName, briefs)

    console.log('New mixtape brief stored:', record)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ ok: true, briefId: record.id })
    }
  } catch (err) {
    console.error('submit-mixtape-brief error:', err)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'server-error'
    }
  }
}
