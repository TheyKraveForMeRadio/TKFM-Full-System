import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
  const payload = JSON.parse(event.body)

  if (payload.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'ignored' }
  }

  const { mixtapeId, tier } = payload.data.object.metadata
  const store = await getStore('mixtapes')

  const days = { basic: 7, pro: 14, elite: 30 }
  const expires = Date.now() + days[tier] * 86400000

  const mixtape = store.find(m => m.id === mixtapeId)
  if (!mixtape) return { statusCode: 404 }

  mixtape.featured = true
  mixtape.featureTier = tier
  mixtape.featureExpiresAt = expires

  if (tier === 'elite') mixtape.homepagePin = true

  await setStore('mixtapes', store)
  return { statusCode: 200, body: JSON.stringify({ ok: true, updated: true }) }
}
