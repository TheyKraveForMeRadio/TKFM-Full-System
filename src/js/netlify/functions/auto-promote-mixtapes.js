import { getStore, setStore } from "./_helpers.js"

const PROMOTION_RULES = {
  basic: { views: 100, next: "pro", extendDays: 7 },
  pro: { views: 300, next: "elite", extendDays: 14 }
}

export async function handler(event) {
  // 🔒 INTERNAL EXECUTION ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const store = (await getStore("mixtapes")) || []
  const now = Date.now()

  let upgraded = []

  for (const mixtape of store) {
    if (!mixtape.featured) continue
    if (!mixtape.featureTier) continue
    if (mixtape.featureExpiresAt < now) continue

    const rule = PROMOTION_RULES[mixtape.featureTier]
    if (!rule) continue

    // 🔁 PREVENT REPEAT PROMOTIONS
    if (mixtape.lastAutoPromotion === mixtape.featureTier) continue

    if ((Number(mixtape.featuredViews) || 0) >= rule.views) {
      mixtape.featureTier = rule.next
      mixtape.featureExpiresAt =
        now + rule.extendDays * 24 * 60 * 60 * 1000

      mixtape.lastAutoPromotion = rule.next
      mixtape.autoPromotedAt = now

      upgraded.push({
        id: mixtape.id,
        title: mixtape.title,
        newTier: rule.next
      })
    }
  }

  if (upgraded.length) {
    await setStore("mixtapes", store)
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      upgraded: upgraded.length,
      details: upgraded
    })
  }
}
