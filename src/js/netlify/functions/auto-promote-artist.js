import sgMail from "@sendgrid/mail"
import { getStore, setStore } from "./_helpers.js"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler(event) {
  // 🔒 INTERNAL EXECUTION ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const mixtapes = await getStore("mixtapes") || []
  const artists = await getStore("artists") || []
  const now = Date.now()

  for (const mix of mixtapes) {
    if (mix.featured !== true) continue
    if (Number(mix.featuredViews) < 150) continue
    if (!mix.dj) continue

    let artist = artists.find(a => a.name === mix.dj)

    if (!artist) {
      artist = {
        id: `ART-${mix.dj.replace(/\s+/g, "-").toLowerCase()}`,
        name: mix.dj,
        email: mix.djEmail || null,
        featured: false,
        spotlightExpiresAt: null,
        totalViews: 0,
        notified: false
      }
      artists.push(artist)
    }

    artist.totalViews += Number(mix.featuredViews) || 0

    // ⭐ FEATURED ARTIST PROMOTION
    if (artist.featured !== true) {
      artist.featured = true
      artist.spotlightExpiresAt = now + 1000 * 60 * 60 * 24 * 7

      // 📬 NOTIFY ARTIST (FAIL-SAFE)
      if (artist.email && artist.notified !== true && process.env.SENDGRID_API_KEY) {
        try {
          await sgMail.send({
            to: artist.email,
            from: "alerts@tkfmradio.com",
            subject: "🔥 You Are Now a Featured Artist on TKFM",
            html: `
              <h2>🚀 Congratulations!</h2>
              <p>Your mixtape performance has promoted you to:</p>
              <h3>🔥 FEATURED ARTIST</h3>
              <p>Your artist profile is now pinned and promoted site-wide.</p>
              <a href="https://www.tkfmradio.com/dj"
                style="display:inline-block;
                       padding:12px 20px;
                       background:#ff00ff;
                       color:#000;
                       font-weight:bold;
                       border-radius:8px;
                       text-decoration:none;">
                Upgrade Your Exposure
              </a>
            `
          })
          artist.notified = true
        } catch (err) {
          console.error("SendGrid error:", err.message)
        }
      }
    }
  }

  await setStore("artists", artists)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      artistsTracked: artists.length
    })
  }
}
