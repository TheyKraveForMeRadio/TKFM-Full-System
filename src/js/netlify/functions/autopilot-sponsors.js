import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL ROTATION ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const sponsors = (await getStore("sponsors")) || []

    if (!sponsors.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          rotated: false,
          message: "no-sponsors"
        })
      }
    }

    // 🔄 ROTATE INVENTORY (FIFO)
    const rotatedSponsor = sponsors.shift()
    sponsors.push(rotatedSponsor)

    await setStore("sponsors", sponsors)

    console.log(
      `🔄 Sponsor rotated: ${rotatedSponsor.name || "unknown"}`
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        job: "sponsor-rotation",
        rotated: true,
        sponsor: rotatedSponsor.name || "unknown",
        executedAt: Date.now()
      })
    }
  } catch (err) {
    console.error("Sponsor rotation handler error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Internal Server Error"
      })
    }
  }
}
