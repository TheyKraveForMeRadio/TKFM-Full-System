import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL EXECUTION ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const mixtapes = await getStore("mixtapes") || []
  const now = Date.now()

  const tierWeight = {
    elite: 3,
    pro: 2,
    basic: 1
  }

  mixtapes.forEach(m => {
    const views = Number(m.featuredViews) || 0
    const tierScore = tierWeight[m.featureTier] || 0
    const createdAt = Number(m.createdAt) || now
    const ageHours = Math.max((now - createdAt) / 36e5, 0)

    // 🧠 AI SCORE (ENTERPRISE FORMULA)
    const score =
      (views * 1.4) +
      (tierScore * 250) -
      (ageHours * 1.2)

    m.aiScore = Math.max(Math.round(score), 0)
  })

  // 📊 SORT BY INTELLIGENCE
  mixtapes.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))

  // 👑 HOMEPAGE KING (ONE ONLY)
  mixtapes.forEach(m => { m.homepagePin = false })
  if (mixtapes[0]) mixtapes[0].homepagePin = true

  // 🔄 AUTO DEMOTION (QUALITY CONTROL)
  mixtapes.forEach(m => {
    if (m.featured === true && m.aiScore < 100) {
      m.featured = false
      m.featureTier = null
      m.featureExpiresAt = null
    }
  })

  await setStore("mixtapes", mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      homepageKing: mixtapes[0]?.title || null,
      totalRanked: mixtapes.length
    })
  }
}
