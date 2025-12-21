import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const mixtapes = await getStore('mixtapes')
  const now = Date.now()

  mixtapes.forEach(m => {
    if (m.sponsored && m.sponsorExpiresAt < now) {
      m.sponsored = false
      m.sponsorTier = null
      m.sponsorName = null
      m.sponsorExpiresAt = null
    }
  })

  await setStore('mixtapes', mixtapes)

  return { statusCode: 200, body: 'expired' }
}

import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const sponsors = await getStore('sponsors')

  sponsors.forEach(s => {
    if (!s.active) return
    if (s.lastPaidAt && Date.now() - s.lastPaidAt > 32 * 86400000) {
      s.active = false
    }
  })

  await setStore('sponsors', sponsors)

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
