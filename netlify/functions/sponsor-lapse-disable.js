import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL / CRON ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const sponsors = (await getStore("sponsors")) || []
  const now = Date.now()
  let disabledCount = 0

  sponsors.forEach(s => {
    if (s.active !== true) return

    const lastPaidAt = Number(s.lastPaidAt) || 0
    // 32 days grace window
    if (lastPaidAt && now - lastPaidAt > 32 * 86400000) {
      s.active = false
      s.disabledAt = now
      s.disabledReason = "payment_lapsed"
      disabledCount++
    }
  })

  await setStore("sponsors", sponsors)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      job: "sponsor-lapse-disable",
      disabledCount,
      executedAt: now
    })
  }
}
