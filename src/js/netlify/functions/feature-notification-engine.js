import sgMail from "@sendgrid/mail"
import { getStore, setStore } from "./_helpers.js"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler(event) {
  // 🔒 INTERNAL / CRON ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const mixes = (await getStore("mixtapes")) || []
    let sent = 0
    let failed = 0

    for (const m of mixes) {
      if (m.featured !== true) continue
      if (!m.djEmail) continue
      if (m.featureNotified === true) continue

      try {
        await sgMail.send({
          to: m.djEmail,
          from: "alerts@tkfmradio.com",
          subject: "🔥 Your Mixtape Is Featured on TKFM",
          html: `
            <h2>🔥 You’re Live on TKFM</h2>
            <p>Your mixtape <strong>${m.title || "your release"}</strong> is now featured.</p>
            <p>This means higher visibility, more plays, and ranking boosts.</p>
            <a href="https://www.tkfmradio.com/dj"
               style="display:inline-block;padding:12px 18px;
                      background:#ff00ff;color:#000;
                      text-decoration:none;font-weight:bold;border-radius:8px;">
              Manage Your Feature
            </a>
          `
        })

        m.featureNotified = true
        m.featureNotifiedAt = Date.now()
        sent++
      } catch (emailErr) {
        failed++
        console.error("Feature notify email failed:", m.djEmail, emailErr)
      }
    }

    await setStore("mixtapes", mixes)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        job: "feature-notification-email",
        sent,
        failed,
        executedAt: Date.now()
      })
    }
  } catch (err) {
    console.error("Feature notify handler error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Internal Server Error" })
    }
  }
}
