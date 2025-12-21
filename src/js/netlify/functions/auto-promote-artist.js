import sgMail from '@sendgrid/mail'
import { getStore, setStore } from './_helpers.js'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler() {
  const mixtapes = await getStore('mixtapes')
  const artists = await getStore('artists')
  const now = Date.now()

  for (const mix of mixtapes) {
    if (!mix.featured) continue
    if ((mix.featuredViews || 0) < 150) continue

    let artist = artists.find(a => a.name === mix.dj)

    if (!artist) {
      artist = {
        id: mix.dj,
        name: mix.dj,
        email: mix.djEmail || null,
        featured: false,
        spotlightExpiresAt: null,
        totalViews: 0,
        notified: false
      }
      artists.push(artist)
    }

    artist.totalViews += mix.featuredViews || 0

    if (!artist.featured) {
      artist.featured = true
      artist.spotlightExpiresAt = now + 1000 * 60 * 60 * 24 * 7

      if (artist.email && !artist.notified) {
        await sgMail.send({
          to: artist.email,
          from: 'alerts@tkfmradio.com',
          subject: '🔥 You Are Now a Featured Artist on TKFM',
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
      }
    }
  }

  await setStore('artists', artists)

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, artists: artists.length })
  }
}
