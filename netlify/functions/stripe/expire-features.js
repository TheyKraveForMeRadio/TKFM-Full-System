import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const mixes = await getStore('mixtapes')
  const now = Date.now()

  mixes.forEach(m => {
    if (m.featured && m.featureExpiresAt < now) {
      m.featured = false
      m.featureTier = null
      m.homepagePin = false
    }
  })

  await setStore('mixtapes', mixes)
  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
