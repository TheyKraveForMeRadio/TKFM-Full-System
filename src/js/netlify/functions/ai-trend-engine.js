import { getStore, setStore } from "./_helpers.js"
import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler(event) {
  // 🔒 INTERNAL EXECUTION ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const mixtapes = await getStore("mixtapes") || []
  const now = Date.now()

  for (const mix of mixtapes) {
    if (mix.featured !== true) continue

    const views = Number(mix.featuredViews) || 0
    const createdAt = Number(mix.createdAt) || now
    const ageHours = Math.max((now - createdAt) / 36e5, 1)

    // 📈 TREND SCORE (VELOCITY-BASED)
    const trendScore = views / ageHours
    mix.trendScore = Math.round(trendScore)

    // 🔥 VIRAL SURGE ACTIVATION
    if (trendScore >= 50 && mix.priceSurged !== true) {
      mix.priceSurged = true
      mix.surgeMultiplier = 1.5
      mix.surgeActivatedAt = now

      // 📬 ALERT DJ (FAIL-SAFE)
      if (mix.djEmail && process.env.SENDGRID_API_KEY) {
        try {
          await sgMail.send({
            to: mix.djEmail,
            from: "alerts@tkfmradio.com",
            subject: "🚀 Your Mixtape Is TRENDING on TKFM",
            html: `
              <h2>🔥 VIRAL ALERT</h2>
              <p>Your mixtape <strong>${mix.title || "Your release"}</strong> is trending.</p>
              <p>Feature prices have increased due to demand.</p>
              <p><strong>Upgrade now before prices rise again.</strong></p>
              <a href="https://www.tkfmradio.com/dj"
                style="padding:12px 20px;
                       background:#ffd700;
                       color:#000;
                       font-weight:bold;
                       border-radius:8px;
                       text-decoration:none;">
                Secure Premium Exposure
              </a>
            `
          })
        } catch (err) {
          console.error("SendGrid error:", err.message)
        }
      }
    }

    // ❄️ COOLDOWN — REMOVE SURGE
    if (mix.priceSurged === true && trendScore < 20) {
      mix.priceSurged = false
      mix.surgeMultiplier = 1
      mix.surgeEndedAt = now
    }
  }

  await setStore("mixtapes", mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, updated: true })
  }
}
