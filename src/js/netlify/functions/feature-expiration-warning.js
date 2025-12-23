import sgMail from "@sendgrid/mail"
import { getStore, setStore } from "./_helpers.js"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler(event) {
  // 🔒 INTERNAL / CRON ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const mixtapes = (await getStore("mixtapes")) || []
    const now = Date.now()
    const ONE_DAY = 86400000

    let sent = 0
    let failed = 0

    for (const m of mixtapes) {
      if (m.featured !== true) continue
      if (!m.djEmail) continue
      if (m.expireWarned === true) continue

      const exp = Number(m.featureExpiresAt) || 0
      if (!exp) continue

      if (exp - now <= ONE_DAY && exp > now) {
        try {
          await sgMail.send({
            to: m.djEmail,
            from: "noreply@tkfmradio.com",
            subject: "⏱️ Feature Expiring Soon — Renew Now",
            html: `
              <h2>Your TKFM Feature Is Ending ⏱️</h2>
              <p><strong>${m.title || "Your mixtape"}</strong> expires in less than 24 hours.</p>
              <p>Renew now to keep your spotlight and ranking.</p>
              <a href="https://www.tkfmradio.com/dj"
                 style="display:inline-block;padding:12px 18px;
                        background:#ffd700;color:#000;
                        text-decoration:none;font-weight:bold;border-radius:8px;">
                Renew Feature
              </a>
            `
          })
          m.expireWarned = true
          m.expireWarnedAt = now
          sent++
        } catch (emailErr) {
          failed++
          console.error("Expire warning email failed:", m.djEmail, emailErr)
        }
      }
    }

    await setStore("mixtapes", mixtapes)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        job: "feature-expiration-warning",
        sent,
        failed,
        executedAt: now
      })
    }
  } catch (err) {
    console.error("Expiration warning handler error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Internal Server Error" })
    }
  }
}
