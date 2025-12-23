import sgMail from "@sendgrid/mail"
import { getStore } from "./_helpers.js"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler(event) {
  // 🔒 INTERNAL / CRON ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const sponsors = (await getStore("sponsors")) || []
    let sent = 0
    let failed = 0

    for (const s of sponsors.filter(x => x.active && x.email)) {
      try {
        await sgMail.send({
          to: s.email,
          from: "reports@tkfmradio.com",
          subject: "📊 Your TKFM Sponsor Performance Report",
          html: `
            <h2>${s.name}</h2>
            <p><strong>Impressions:</strong> ${s.impressions || 0}</p>
            <p><strong>Clicks:</strong> ${s.clicks || 0}</p>
            <p>
              Want more exposure?
              <a href="https://www.tkfmradio.com/admin"
                 style="display:inline-block;padding:10px 16px;
                        background:#ff00ff;color:#000;
                        text-decoration:none;font-weight:bold;
                        border-radius:6px;">
                Upgrade Sponsorship
              </a>
            </p>
          `
        })
        sent++
      } catch (emailErr) {
        failed++
        console.error(
          `Sponsor report email failed for ${s.email}:`,
          emailErr
        )
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        job: "sponsor-report-email",
        sent,
        failed,
        total: sponsors.length,
        executedAt: Date.now()
      })
    }

  } catch (err) {
    console.error("Sponsor report handler error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Internal Server Error"
      })
    }
  }
}
