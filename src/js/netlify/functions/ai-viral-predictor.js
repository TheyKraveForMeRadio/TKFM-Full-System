import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL EXECUTION ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const mixtapes = await getStore("mixtapes") || []
  const now = Date.now()

  mixtapes.forEach(m => {
    const views = Number(m.featuredViews) || 0
    const createdAt = Number(m.createdAt) || now
    const ageHours = Math.max((now - createdAt) / 36e5, 1)

    const tierBoost =
      m.featureTier === "elite" ? 3 :
      m.featureTier === "pro" ? 2 : 1

    // 🔮 VIRAL PROBABILITY SCORE (CAPPED)
    const rawScore = (views / ageHours) * tierBoost
    m.viralScore = Math.min(Math.round(rawScore), 300)

    // 📈 MOMENTUM STATUS
    if (m.viralScore >= 120) m.momentum = "🔥 EXPLODING"
    else if (m.viralScore >= 60) m.momentum = "📈 GAINING"
    else if (m.viralScore >= 25) m.momentum = "⚠️ STALLING"
    else m.momentum = "❄️ COLD"

    // 💰 UPGRADE RECOMMENDATION (INTELLIGENT)
    m.recommendedUpgrade =
      m.momentum === "📈 GAINING" && m.featureTier !== "elite"
        ? "elite"
        : null
  })

  await setStore("mixtapes", mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      evaluated: mixtapes.length
    })
  }
}
