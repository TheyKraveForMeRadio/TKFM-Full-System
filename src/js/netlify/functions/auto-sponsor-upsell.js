import sgMail from '@sendgrid/mail'
import { getStore, setStore } from './_helpers.js'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler() {
  const sponsors = await getStore('sponsors')
  const now = Date.now()

  for (const sponsor of sponsors) {
    if (!sponsor.active) continue

    sponsor.views = sponsor.views || 0
    sponsor.lastNotifiedAt = sponsor.lastNotifiedAt || 0

    const viewsTrigger = sponsor.views >= 100
    const cooldownPassed = now - sponsor.lastNotifiedAt > 1000 * 60 * 60 * 24
    const expiringSoon = sponsor.expiresAt - now < 1000 * 60 * 60 * 48

    if ((viewsTrigger || expiringSoon) && cooldownPassed && sponsor.email) {
      await sgMail.send({
        to: sponsor.email,
        from: 'alerts@tkfmradio.com',
        subject: '🔥 Your TKFM Sponsor Ad Is Performing',
        html: `
          <h2>🚀 Sponsor Performance Alert</h2>
          <p><strong>${sponsor.name}</strong> is getting attention.</p>
          <ul>
            <li>👁 Views: ${sponsor.views}</li>
            <li>⏱ Expiration: ${new Date(sponsor.expiresAt).toLocaleString()}</li>
          </ul>
          <p>
            Upgrade now for homepage takeover, elite placement,
            and extended runtime.
          </p>
          <a href="https://www.tkfmradio.com/admin"
             style="padding:12px 20px;background:#ff00ff;color:#000;
                    text-decoration:none;font-weight:bold;border-radius:8px;">
            Upgrade Sponsor Slot
          </a>
        `
      })

      sponsor.lastNotifiedAt = now
    }
  }

  await setStore('sponsors', sponsors)

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, processed: sponsors.length })
  }
}
