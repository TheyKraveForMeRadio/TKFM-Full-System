import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL / CRON ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const mixtapes = (await getStore("mixtapes")) || []
  const now = Date.now()
  let updatedCount = 0

  mixtapes.forEach(m => {
    const exp = Number(m.sponsorExpiresAt) || 0
    if (m.sponsored === true && exp && exp < now) {
      m.sponsored = false
      m.sponsorTier = null
      m.sponsorName = null
      m.sponsorExpiresAt = null
      updatedCount++
    }
  })

  await setStore("mixtapes", mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      job: "mixtape-sponsor-expire",
      updatedCount,
      executedAt: now
    })
  }
}
