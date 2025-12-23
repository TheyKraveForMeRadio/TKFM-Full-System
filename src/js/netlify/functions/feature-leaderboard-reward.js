import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL / CRON ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const mixtapes = (await getStore("mixtapes")) || []
  const now = Date.now()

  // 🗓️ Reward cycle (daily). Change to weekly if you want.
  const rewardCycleId = new Date(now).toISOString().slice(0, 10) // YYYY-MM-DD

  const featured = mixtapes
    .filter(m => m.featured === true && Number(m.featureExpiresAt) > now)
    .sort((a, b) => (Number(b.featuredViews) || 0) - (Number(a.featuredViews) || 0))

  const rewards = [
    { tier: "elite", days: 7, badge: "🥇 #1 FEATURE" },
    { tier: "pro", days: 5, badge: "🥈 TOP FEATURE" },
    { tier: "basic", days: 3, badge: "🥉 TRENDING" }
  ]

  let applied = 0

  rewards.forEach((r, i) => {
    const m = featured[i]
    if (!m) return

    // ✅ Prevent double-rewarding in the SAME cycle only
    if (m.leaderboardRewardCycleId === rewardCycleId) return

    m.featureTier = r.tier
    m.featureExpiresAt = now + r.days * 86400000
    m.leaderboardBadge = r.badge
    m.leaderboardRewardCycleId = rewardCycleId
    m.leaderboardRewardedAt = now

    applied++
  })

  await setStore("mixtapes", mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      job: "leaderboard-rewards",
      applied,
      cycle: rewardCycleId,
      executedAt: now
    })
  }
}
