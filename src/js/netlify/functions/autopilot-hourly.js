import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL CRON / SYSTEM ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const mixtapes = (await getStore("mixtapes")) || []

    const featured = mixtapes.filter(m => m.featured)
    if (!featured.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          promoted: false,
          message: "no-featured"
        })
      }
    }

    // 📊 SORT BY PERFORMANCE
    featured.sort(
      (a, b) => (b.featuredViews || 0) - (a.featuredViews || 0)
    )

    let homepagePinnedMixtape = null

    featured.forEach((m, index) => {
      m.rank = index + 1
      m.homepagePin = index === 0
      if (index === 0) {
        homepagePinnedMixtape = m.title || m.id || "unknown"
      }
    })

    await setStore("mixtapes", mixtapes)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        job: "mixtape-ranking-promotion",
        totalFeatured: featured.length,
        homepagePinned: homepagePinnedMixtape,
        executedAt: Date.now()
      })
    }
  } catch (err) {
    console.error("Mixtape promotion handler error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Internal Server Error"
      })
    }
  }
}
