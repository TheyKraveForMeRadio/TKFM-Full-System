import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL SYSTEM ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const stats =
      (await getStore("stats")) || {
        eliteSold: 0,
        elitePrice: 100,
        priceRaised: false
      }

    let updated = false

    // 📈 DEMAND-BASED PRICE ESCALATION
    if (stats.eliteSold >= 3 && !stats.priceRaised) {
      stats.elitePrice = 150
      stats.priceRaised = true
      updated = true

      console.log(
        "🔺 Elite price raised to $150 due to demand threshold."
      )
    }

    await setStore("stats", stats)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        job: "pricing-adjustment",
        updated,
        eliteSold: stats.eliteSold,
        elitePrice: stats.elitePrice,
        priceRaised: stats.priceRaised,
        executedAt: Date.now()
      })
    }
  } catch (err) {
    console.error("Pricing handler error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Internal Server Error"
      })
    }
  }
}
