import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL EXECUTION ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const mixes = await getStore("mixtapes") || []

  // 🎯 FEATURED ONLY
  const featured = mixes.filter(m => m.featured === true)

  // 📊 SORT BY PERFORMANCE
  featured.sort(
    (a, b) => (Number(b.featuredViews) || 0) - (Number(a.featuredViews) || 0)
  )

  // 💰 NEAR-TOP UPSELL SIGNAL
  featured.forEach((m, index) => {
    m.recommendUpgrade = false

    if (
      index === 1 && // second place
      m.featureTier === "pro" &&
      m.featured === true
    ) {
      m.recommendUpgrade = true
    }
  })

  await setStore("mixtapes", mixes)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      evaluated: featured.length
    })
  }
}
