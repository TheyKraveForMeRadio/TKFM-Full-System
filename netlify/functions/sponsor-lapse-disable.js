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

  // Method lock (cron/internal only)
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

  const sponsors = (await getStore('sponsors')) || []
  if (!Array.isArray(sponsors)) {
    return json(500, { error: 'Store shape invalid' })
  }

  const now = Date.now()
  let disabledCount = 0

  for (const s of sponsors) {
    if (!s || typeof s !== 'object') continue
    if (s.active !== true) continue

    const lastPaidAt = Number(s.lastPaidAt) || 0
    // 32-day grace window
    if (lastPaidAt > 0 && now - lastPaidAt > 32 * 86400000) {
      s.active = false
      s.disabledAt = now
      s.disabledReason = 'payment_lapsed'
      disabledCount++
    }
  }

  if (disabledCount > 0) {
    await setStore('sponsors', sponsors)
  }

  return json(200, {
    ok: true,
    job: 'sponsor-lapse-disable',
    disabledCount,
    executedAt: now,
  })
}
