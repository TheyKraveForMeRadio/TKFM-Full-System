import { getStore } from './_helpers.js'

export async function handler() {
  const mixtapes = await getStore('mixtapes')
  const now = Date.now()

  const tierRank = { elite: 3, pro: 2, basic: 1 }

  const leaderboard = mixtapes
    .filter(m => m.featured && m.featureExpiresAt > now)
    .sort((a, b) => {
      // 1️⃣ Tier
      const tierDiff =
        (tierRank[b.featureTier] || 0) -
        (tierRank[a.featureTier] || 0)
      if (tierDiff !== 0) return tierDiff

      // 2️⃣ Views
      const viewsDiff =
        (b.featuredViews || 0) -
        (a.featuredViews || 0)
      if (viewsDiff !== 0) return viewsDiff

      // 3️⃣ Time remaining
      return b.featureExpiresAt - a.featureExpiresAt
    })
    .map((m, index) => ({
      rank: index + 1,
      id: m.id,
      title: m.title,
      dj: m.dj,
      tier: m.featureTier,
      views: m.featuredViews || 0,
      expiresAt: m.featureExpiresAt
    }))

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      leaderboard
    })
  }
}
