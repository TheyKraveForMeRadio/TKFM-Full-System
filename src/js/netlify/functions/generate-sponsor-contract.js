export async function handler(event) {
  const { brandName, plan } = JSON.parse(event.body)

  const contract = `
TKFM RADIO OFFICIAL SPONSOR AGREEMENT

Brand: ${brandName}
Plan: ${plan.toUpperCase()}
Billing: Monthly (Stripe)

Includes:
• Homepage placement
• Category exclusivity
• Analytics reporting

Signed electronically via Stripe
`

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/pdf'
    },
    body: Buffer.from(contract).toString('base64'),
    isBase64Encoded: true
  }
}
