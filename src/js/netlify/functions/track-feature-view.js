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
    const mixtapeId = String(body.mixtapeId || "").trim()

    if (!mixtapeId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ ok: false, error: "Missing mixtapeId" })
      }
    }

    const now = Date.now()

    // 🔒 Lightweight anti-spam: same IP + mixtapeId cooldown (15s)
    const ip =
      event.headers["x-nf-client-connection-ip"] ||
      event.headers["x-forwarded-for"] ||
      "unknown"

    const key = `view:${ip}:${mixtapeId}`
    const viewCache = (await getStore("view_cache")) || {}
    const last = Number(viewCache[key]) || 0

    if (now - last < 15000) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ ok: true, counted: false, cooldown: true })
      }
    }

    const mixtapes = (await getStore("mixtapes")) || []
    const mix = mixtapes.find(m => m.id === mixtapeId)

    if (!mix) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ ok: false, error: "Mixtape not found" })
      }
    }

    // Optional: only count views if currently featured (recommended)
    // If you want views for ALL mixtapes, remove this block.
    if (mix.featured !== true) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ ok: true, counted: false, reason: "not_featured" })
      }
    }

    mix.featuredViews = (Number(mix.featuredViews) || 0) + 1
    mix.lastViewAt = now

    await setStore("mixtapes", mixtapes)

    viewCache[key] = now
    // keep cache bounded
    const keys = Object.keys(viewCache)
    if (keys.length > 3000) {
      for (let i = 0; i < 800; i++) delete viewCache[keys[i]]
    }
    await setStore("view_cache", viewCache)

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ ok: true, counted: true })
    }
  } catch (err) {
    console.error("Featured view tracker error:", err)
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
