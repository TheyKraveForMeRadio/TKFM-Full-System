import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const mixtapes = await getStore('mixtapes')
  const now = Date.now()

  mixtapes.forEach(m => {
    const views = m.featuredViews || 0
    const ageHours = (now - m.createdAt) / 36e5
    const tierBoost = m.featureTier === 'elite' ? 3 : m.featureTier === 'pro' ? 2 : 1

    // 🔮 VIRAL PROBABILITY SCORE
    m.viralScore = Math.round(
      (views / Math.max(ageHours, 1)) * tierBoost
    )

    // 📈 MOMENTUM STATUS
    if (m.viralScore > 120) m.momentum = '🔥 EXPLODING'
    else if (m.viralScore > 60) m.momentum = '📈 GAINING'
    else if (m.viralScore > 25) m.momentum = '⚠️ STALLING'
    else m.momentum = '❄️ COLD'

    // 💰 UPGRADE RECOMMENDATION
    m.recommendedUpgrade =
      m.momentum === '📈 GAINING' && m.featureTier !== 'elite'
        ? 'elite'
        : null
  })

  await setStore('mixtapes', mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  }
}
