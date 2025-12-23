import { getStore, setStore } from './_helpers.js'

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj),
  }
}

function getInternalKey(event) {
  return (
    event?.headers?.['x-tkfm-internal-key'] ||
    event?.headers?.['X-TKFM-Internal-Key'] ||
    event?.headers?.['x-internal-cron-key'] ||
    event?.headers?.['X-Internal-Cron-Key'] ||
    ''
  )
}

export async function handler(event) {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }

  // Method lock (cron should not be callable by browsers)
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' })
  }

  // Config lock
  if (!process.env.INTERNAL_CRON_KEY) {
    return json(500, { error: 'Server not configured' })
  }

  // 🔒 INTERNAL / CRON ONLY
  const provided = getInternalKey(event)
  if (!provided || provided !== process.env.INTERNAL_CRON_KEY) {
    return json(403, { error: 'Forbidden' })
  }

  const mixtapes = (await getStore('mixtapes')) || []
  if (!Array.isArray(mixtapes)) {
    return json(500, { error: 'Store shape invalid' })
  }

  const now = Date.now()
  let updatedCount = 0

  for (const m of mixtapes) {
    if (!m || typeof m !== 'object') continue
    const exp = Number(m.sponsorExpiresAt) || 0
    if (m.sponsored === true && exp > 0 && exp < now) {
      m.sponsored = false
      m.sponsorTier = null
      m.sponsorName = null
      m.sponsorExpiresAt = null
      updatedCount++
    }
  }

  // Only write if changes occurred (optional but clean)
  if (updatedCount > 0) {
    await setStore('mixtapes', mixtapes)
  }

  return json(200, {
    ok: true,
    job: 'mixtape-sponsor-expire',
    updatedCount,
    executedAt: now,
  })
}
