import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // ✅ CORS / Preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    }
  }

  try {
    const body = JSON.parse(event.body || "{}")
    const sponsorId = String(body.sponsorId || "").trim()

    if (!sponsorId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ ok: false, error: "Missing sponsorId" })
      }
    }

    // 🔒 Lightweight anti-spam: same IP + sponsorId cooldown (30s)
    const ip =
      event.headers["x-nf-client-connection-ip"] ||
      event.headers["x-forwarded-for"] ||
      "unknown"

    const now = Date.now()
    const clickKey = `click:${ip}:${sponsorId}`

    const clickCache = (await getStore("click_cache")) || {}
    const last = Number(clickCache[clickKey]) || 0

    if (now - last < 30000) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ ok: true, counted: false, cooldown: true })
      }
    }

    const sponsors = (await getStore("sponsors")) || []
    const sponsor = sponsors.find(s => s.id === sponsorId)

    // Only count clicks for active sponsors
    if (sponsor && sponsor.active === true) {
      sponsor.clicks = (Number(sponsor.clicks) || 0) + 1
      sponsor.lastClickAt = now
      await setStore("sponsors", sponsors)

      clickCache[clickKey] = now
      // Keep cache from growing forever
      const keys = Object.keys(clickCache)
      if (keys.length > 2000) {
        // drop oldest-ish by deleting some keys
        for (let i = 0; i < 500; i++) delete clickCache[keys[i]]
      }
      await setStore("click_cache", clickCache)

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ ok: true, counted: true })
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ ok: true, counted: false })
    }
  } catch (err) {
    console.error("Sponsor click tracker error:", err)
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ ok: false, error: "Internal Server Error" })
    }
  }
}

