import { getStore, setStore } from './_helpers.js'

function resp(statusCode, bodyObj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(bodyObj),
  }
}

export async function handler(event) {
  // Preflight safe response (even without CORS)
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  if (event.httpMethod !== 'POST') return resp(405, { error: 'Method Not Allowed' })

  let payload
  try {
    payload = event.body ? JSON.parse(event.body) : null
  } catch {
    return resp(400, { error: 'Invalid JSON' })
  }

  const sponsorId = payload?.sponsorId
  if (typeof sponsorId !== 'string' || sponsorId.length < 3 || sponsorId.length > 128) {
    return resp(400, { error: 'Invalid sponsorId' })
  }

  const sponsors = (await getStore('sponsors')) || []
  if (!Array.isArray(sponsors)) return resp(500, { error: 'Store shape invalid' })

  const s = sponsors.find(x => x && x.id === sponsorId)
  if (s) {
    s.views = (s.views || 0) + 1
    s.lastViewedAt = Date.now()
    await setStore('sponsors', sponsors)
  }

  return resp(200, { ok: true })
}

