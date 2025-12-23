import sgMail from "@sendgrid/mail"
import { getStore, setStore } from "./_helpers.js"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler(event) {
  // 🔒 INTERNAL EXECUTION ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const sponsors = (await getStore("sponsors")) || []
    const now = Date.now()
    let emailsSent = 0

    await Promise.all(
      sponsors.map(async sponsor => {
        if (!sponsor.active) return

        sponsor.views = sponsor.views || 0
        sponsor.lastNotifiedAt = sponsor.lastNotifiedAt || 0

        const viewsTrigger = sponsor.views >= 100
        const cooldownPassed =
          now - sponsor.lastNotifiedAt > 1000 * 60 * 60 * 24 // 24h
        const expiringSoon =
          sponsor.expiresAt
            ? sponsor.expiresAt - now < 1000 * 60 * 60 * 48 // 48h
            : false

        if (
          (viewsTrigger || expiringSoon) &&
          cooldownPassed &&
          sponsor.email
        ) {
          try {
            await sgMail.send({
              to: sponsor.email,
              from: "alerts@tkfmradio.com",
              subject: "🔥 Your TKFM Sponsor Ad Is Performing",
              html: `
                <h2>🚀 Sponsor Performance Alert</h2>
                <p><strong>${sponsor.name}</strong> is getting attention.</p>
                <ul>
                  <li>👁 Views: ${sponsor.views}</li>
                  <li>⏱ Expiration: ${
                    sponsor.expiresAt
                      ? new Date(sponsor.expiresAt).toLocaleString()
                      : "N/A"
                  }</li>
                </ul>
                <p>
                  Upgrade now for homepage takeover, elite placement,
                  and extended runtime.
                </p>
                <a href="https://www.tkfmradio.com/admin"
                   style="display:inline-block;
                          padding:12px 20px;
                          background:#ff00ff;
                          color:#000;
                          text-decoration:none;
                          font-weight:bold;
                          border-radius:8px;">
                  Upgrade Sponsor Slot
                </a>
              `
            })

            sponsor.lastNotifiedAt = now
            emailsSent++
          } catch (emailErr) {
            console.error(
              "Failed to send sponsor email:",
              sponsor.email,
              emailErr
            )
          }
        }
      })
    )

    await setStore("sponsors", sponsors)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        sponsorsProcessed: sponsors.length,
        emailsSent,
        executedAt: now
      })
    }
  } catch (err) {
    console.error("Sponsor handler error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Internal Server Error"
      })
    }
  }
}
