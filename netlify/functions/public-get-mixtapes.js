import { getStore } from "./_helpers.js"

export async function handler() {
  try {
    const mixtapes = (await getStore("mixtapes")) || []
    const now = Date.now()

    // ✅ Public-safe output only
    const items = mixtapes.map(m => {
      m = m || {}

      const expiresAt = Number(m.featureExpiresAt) || 0
      const featuredActive = m.featured === true && expiresAt > now

      return {
        id: m.id || null,
        title: m.title || "Untitled",
        artist: m.artist || m.djName || m.dj || null,

        // media
        audioUrl: m.audioUrl || null,
        coverImage: m.coverImage || m.artwork || null,

        // featured + ranking (public-safe)
        featured: featuredActive,              // only true if active
        featuredActive,                        // explicit
        featureTier: featuredActive ? (m.featureTier || null) : null,
        featureExpiresAt: featuredActive ? expiresAt : null,
        featuredViews: Number(m.featuredViews) || 0,

        // optional public badges
        leaderboardBadge: m.leaderboardBadge || null,
        homepagePin: m.homepagePin === true
      }
    })

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
    console.error("public-get-mixtapes error:", err)
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ ok: false, error: "Failed to load mixtapes" })
    }
  }
}
