import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const mixtapes = await getStore('mixtapes')
  const now = Date.now()

  mixtapes.forEach(m => {
    if (m.featured && m.featureExpiresAt < now) {
      m.featured = false
      m.featureTier = null
      m.homepagePin = false
    }
  })

  await setStore('mixtapes', mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, cycle: 'daily-complete' })
  }
}
