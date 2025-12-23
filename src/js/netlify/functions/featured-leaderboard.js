import { getStore } from "./_helpers.js"

export async function handler() {
  const mixtapes = (await getStore("mixtapes")) || []
  const now = Date.now()

  const tierRank = { elite: 3, pro: 2, basic: 1 }

  const leaderboard = mixtapes
    .filter(m => m.featured === true && Number(m.featureExpiresAt) > now)
    .sort((a, b) => {
      // 1️⃣ Tier priority
      const tierDiff =
        (tierRank[(b.featureTier || "").toLowerCase()] || 0) -
        (tierRank[(a.featureTier || "").toLowerCase()] || 0)
      if (tierDiff !== 0) return tierDiff

      // 2️⃣ Views priority
      const viewsDiff =
        (Number(b.featuredViews) || 0) - (Number(a.featuredViews) || 0)
      if (viewsDiff !== 0) return viewsDiff

      // 3️⃣ Time remaining (more remaining = higher rank)
      return (Number(b.featureExpiresAt) || 0) - (Number(a.featureExpiresAt) || 0)
    })
    .map((m, index) => ({
      // ✅ public-safe fields only
      rank: index + 1,
      id: m.id,
      title: m.title,
      djName: m.djName || m.dj || null,
      tier: (m.featureTier || "").toLowerCase() || null,
      views: Number(m.featuredViews) || 0,
      expiresAt: Number(m.featureExpiresAt) || null,
      homepagePin: m.homepagePin === true,
      leaderboardBadge: m.leaderboardBadge || null
    }))

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60"
    },
    body: JSON.stringify({
      ok: true,
      total: leaderboard.length,
      leaderboard
    })
  }
}
