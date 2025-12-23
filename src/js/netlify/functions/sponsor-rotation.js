import { getStore } from "./_helpers.js"

function pickDeterministic(list, seedStr) {
  // simple deterministic hash
  let h = 0
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0
  return list[h % list.length]
}

export async function handler(event) {
  try {
    const sponsors = (await getStore("sponsors")) || []

    const active = sponsors.filter(s => s.active === true)
    if (!active.length) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60"
        },
        body: JSON.stringify({ ok: true, sponsor: null })
      }
    }

    // ✅ rotate “randomly” but stable per minute (prevents flicker)
    const minuteKey = new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
    const pick = pickDeterministic(active, minuteKey)

    // ✅ public-safe fields only
    const sponsor = {
      id: pick.id,
      name: pick.name || pick.brandName || null,
      logoUrl: pick.logoUrl || null,
      link: pick.link || pick.website || null,
      tier: pick.tier || pick.plan || null
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60"
      },
      body: JSON.stringify({ ok: true, sponsor })
    }
  } catch (err) {
    console.error("Sponsor pick error:", err)
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ ok: false, error: "Sponsor rotation failed" })
    }
  }
}
