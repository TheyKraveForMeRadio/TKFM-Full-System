import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const mixtapes = await getStore('mixtapes')
  const now = Date.now()

  const tierWeight = {
    elite: 3,
    pro: 2,
    basic: 1
  }

  mixtapes.forEach(m => {
    const views = m.featuredViews || 0
    const tierScore = tierWeight[m.featureTier] || 0
    const ageHours = (now - m.createdAt) / 36e5

    // 🧠 AI SCORE (CORE FORMULA)
    m.aiScore = Math.round(
      (views * 1.4) +
      (tierScore * 250) -
      (ageHours * 1.2)
    )
  })

  mixtapes.sort((a, b) => b.aiScore - a.aiScore)

  // 👑 HOMEPAGE KING
  mixtapes.forEach(m => m.homepagePin = false)
  if (mixtapes[0]) mixtapes[0].homepagePin = true

  // 🔄 AUTO DEMOTION
  mixtapes.forEach(m => {
    if (m.featured && m.aiScore < 100) {
      m.featured = false
      m.featureTier = null
      m.featureExpiresAt = null
    }
  })

  await setStore('mixtapes', mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      homepageKing: mixtapes[0]?.title || null
    })
  }
}
