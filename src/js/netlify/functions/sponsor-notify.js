import sgMail from "@sendgrid/mail"
import { getStore } from "./_helpers.js"

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function handler(event) {
  // 🔒 INTERNAL / ADMIN ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const body = JSON.parse(event.body || "{}")

    const sponsorId = body.sponsorId
    const subject = String(body.subject || "TKFM Sponsor Update").slice(0, 120)
    const message = String(body.message || "").slice(0, 5000)

    if (!sponsorId || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Invalid request" })
      }
    }

    // 🔒 Email destination resolved SERVER-SIDE
    const sponsors = (await getStore("sponsors")) || []
    const sponsor = sponsors.find(s => s.id === sponsorId && s.active === true)

    if (!sponsor || !sponsor.email) {
      return {
        statusCode: 404,
        body: JSON.stringify({ ok: false, error: "Sponsor not found" })
      }
    }

    await sgMail.send({
      to: sponsor.email,
      from: "partners@tkfmradio.com",
      subject,
      text: message
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        sentTo: sponsor.id,
        executedAt: Date.now()
      })
    }
  } catch (err) {
    console.error("Partner email send error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Internal Server Error" })
    }
  }
}
