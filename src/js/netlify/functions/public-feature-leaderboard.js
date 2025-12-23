import { getStore } from "./_helpers.js"

export async function handler() {
  try {
    const mixtapes = (await getStore("mixtapes")) || []

    const tierWeight = { elite: 3, pro: 2, basic: 1 }
    const now = Date.now()

    const items = mixtapes
      .filter(m => m.featured === true && Number(m.featureExpiresAt) > now)
      .map(m => {
        const tier = (m.featureTier || "").toLowerCase()
        const views = Number(m.featuredViews) || 0
        const score = views * (tierWeight[tier] || 1)

        return {
          // ✅ public-safe fields
          id: m.id,
          title: m.title,
          djName: m.djName || m.dj || null,
          tier: tier || null,
          views,
          score,

          // Optional: only keep if your audio is meant to be publicly playable
          audioUrl: m.audioUrl || null
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60"
      },
      body: JSON.stringify({
        ok: true,
        total: items.length,
        items
      })
    }
  } catch (err) {
    console.error("Leaderboard error", err)
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ ok: false, error: "Leaderboard failed" })
    }
  }
}
