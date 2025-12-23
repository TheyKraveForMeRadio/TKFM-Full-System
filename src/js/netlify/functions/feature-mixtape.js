import { verifyDJ, getStore, setStore } from "./_helpers.js"

const TIERS = {
  basic: { days: 7, weight: 1, label: "🔥 FEATURED" },
  pro: { days: 14, weight: 2, label: "💎 PRO FEATURE" },
  elite: { days: 30, weight: 3, label: "👑 ELITE FEATURE" }
}

export async function handler(event) {
  try {
    const user = verifyDJ(event)
    if (!user || !user.id) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: "Unauthorized" })
      }
    }

    const body = JSON.parse(event.body || "{}")
    const mixtapeId = body.mixtapeId
    const tier = (body.tier || "").toLowerCase()

    if (!mixtapeId || !TIERS[tier]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Invalid request" })
      }
    }

    // 🔒 OPTIONAL: surge lock (elite only) based on server stats
    const stats = (await getStore("stats")) || {}
    const surgeActive = stats.surgeActive === true
    if (surgeActive && tier !== "elite") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          ok: false,
          error: "Lower tiers locked during surge",
          requiredTier: "elite"
        })
      }
    }

    const mixtapes = (await getStore("mixtapes")) || []
    const idx = mixtapes.findIndex(m => m.id === mixtapeId && m.djId === user.id)

    if (idx === -1) {
      return {
        statusCode: 404,
        body: JSON.stringify({ ok: false, error: "Mixtape not found" })
      }
    }

    const now = Date.now()
    const expires = now + TIERS[tier].days * 86400000

    // ✅ Canonical fields used everywhere else in your platform:
    mixtapes[idx].featured = true
    mixtapes[idx].featureTier = tier
    mixtapes[idx].featureWeight = TIERS[tier].weight
    mixtapes[idx].featureLabel = TIERS[tier].label
    mixtapes[idx].featureExpiresAt = expires
    mixtapes[idx].featuredAt = now

    await setStore("mixtapes", mixtapes)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        featured: true,
        tier,
        featureExpiresAt: expires
      })
    }
  } catch (err) {
    console.error("Feature apply error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Internal Server Error" })
    }
  }
}
