import { getStore, setStore } from './_helpers.js'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler() {
  const mixtapes = await getStore('mixtapes')
  const now = Date.now()

  for (const mix of mixtapes) {
    if (!mix.featured) continue

    const views = mix.featuredViews || 0
    const ageHours = (now - mix.createdAt) / 36e5

    // 📈 TREND SCORE (SIMPLE AI HEURISTIC)
    const trendScore = views / Math.max(ageHours, 1)

    mix.trendScore = Math.round(trendScore)

    // 🔥 VIRAL DETECTION
    if (trendScore >= 50 && !mix.priceSurged) {
      mix.priceSurged = true
      mix.surgeMultiplier = 1.5
      mix.surgeActivatedAt = now

      // 📬 ALERT DJ
      if (mix.djEmail) {
        await sgMail.send({
          to: mix.djEmail,
          from: 'alerts@tkfmradio.com',
          subject: '🚀 Your Mixtape Is TRENDING on TKFM',
          html: `
            <h2>🔥 VIRAL ALERT</h2>
            <p>Your mixtape <strong>${mix.title}</strong> is trending.</p>
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
      }
    }

    // ❄️ COOLDOWN — REMOVE SURGE
    if (mix.priceSurged && trendScore < 20) {
      mix.priceSurged = false
      mix.surgeMultiplier = 1
    }
  }

  await setStore('mixtapes', mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, updated: true })
  }
}
