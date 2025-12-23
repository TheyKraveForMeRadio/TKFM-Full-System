import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL CRON ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const mixtapes = (await getStore("mixtapes")) || []
    const now = Date.now()
    let updatedCount = 0

    for (const m of mixtapes) {
      if (
        m.featured &&
        m.featureExpiresAt &&
        m.featureExpiresAt < now
      ) {
        m.featured = false
        m.featureTier = null
        m.homepagePin = false
        m.featureExpiresAt = null
        m.priceSurged = false
        m.surgeMultiplier = 1
        updatedCount++
      }
    }

    await setStore("mixtapes", mixtapes)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        job: "daily-mixtape-cleanup",
        updatedCount,
        executedAt: now
      })
    }
  } catch (err) {
    console.error("Daily mixtape cleanup error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Internal Server Error"
      })
    }
  }
}
