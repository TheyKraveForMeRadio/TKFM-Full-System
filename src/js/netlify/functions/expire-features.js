import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL / CRON ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const mixes = (await getStore("mixtapes")) || []
  const now = Date.now()
  let updatedCount = 0

  mixes.forEach(m => {
    const expiresAt = Number(m.featureExpiresAt) || 0

    if (m.featured === true && expiresAt && expiresAt < now) {
      m.featured = false
      m.featureTier = null
      m.homepagePin = false
      m.featureExpiresAt = null
      m.priceSurged = false
      m.surgeMultiplier = 1
      updatedCount++
    }
  })

  await setStore("mixtapes", mixes)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      job: "mixtape-expiration-cleanup",
      updatedCount,
      executedAt: now
    })
  }
}
