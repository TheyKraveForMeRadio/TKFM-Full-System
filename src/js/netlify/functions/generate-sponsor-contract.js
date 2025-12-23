export async function handler(event) {
  // 🔒 INTERNAL / ADMIN ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const body = JSON.parse(event.body || "{}")
    const brandName = body.brandName
    const plan = (body.plan || "").toLowerCase()

    const PLANS = {
      bronze: "Bronze Sponsor",
      silver: "Silver Sponsor",
      gold: "Gold Sponsor"
    }

    if (!brandName || !PLANS[plan]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Invalid contract data" })
      }
    }

    const contractId = `TKFM-SP-${Date.now()}`
    const signedAt = new Date().toUTCString()

    // ⚖️ SIMPLE, LEGAL-SAFE CONTRACT TEXT
    const contractText = `
TKFM RADIO – OFFICIAL SPONSOR AGREEMENT

Contract ID: ${contractId}
Date: ${signedAt}

Sponsor Brand:
${brandName}

Sponsorship Plan:
${PLANS[plan]}

Billing:
Monthly subscription billed via Stripe.

Inclusions:
• Homepage sponsor placement
• Category exclusivity (subject to availability)
• Performance analytics reporting
• Sponsor rotation or pinning based on plan tier

Term:
This agreement remains active while the Stripe subscription is active.

Termination:
Either party may terminate by canceling the Stripe subscription.

Acceptance:
This agreement is considered accepted upon successful Stripe payment.

TKFM Radio
https://www.tkfmradio.com
`

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="TKFM_Sponsor_Contract_${contractId}.pdf"`
      },
      body: Buffer.from(contractText).toString("base64"),
      isBase64Encoded: true
    }

  } catch (err) {
    console.error("Contract generation error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Internal Server Error" })
    }
  }
}
