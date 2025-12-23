import { getStore } from "./_helpers.js"

export async function handler() {
  const mixtapes = (await getStore("mixtapes")) || []

  const ranked = mixtapes
    .filter(m => m.featured === true)
    .sort((a, b) => (Number(b.featuredViews) || 0) - (Number(a.featuredViews) || 0))
    .map((m, i) => ({
      // ✅ PUBLIC-SAFE FIELDS ONLY
      id: m.id,
      title: m.title,
      djName: m.djName || m.dj || null,
      coverImage: m.coverImage || m.artwork || null,
      featuredViews: Number(m.featuredViews) || 0,
      featureTier: m.featureTier || null,
      leaderboardBadge: m.leaderboardBadge || null,
      homepagePin: m.homepagePin === true,

      // derived
      rank: i + 1,
      almostTop: i === 1
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
      total: ranked.length,
      items: ranked
    })
  }
}

