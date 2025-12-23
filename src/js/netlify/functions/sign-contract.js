// netlify/functions/sign-contract.js
import { getStore, setStore } from "./_helpers.js"

/**
 * ENTERPRISE LOCKED: Contract signing endpoint
 * - Internal-only (requires x-tkfm-internal-key header)
 * - Records a signed sponsor contract in storage
 * - Safe, auditable, idempotent (won’t double-sign same contractId)
 *
 * Expected POST body:
 * {
 *   "contractId": "TKFM-SP-123...",
 *   "brandName": "Acme Co",
 *   "plan": "bronze|silver|gold",
 *   "stripeCustomerId": "cus_...",
 *   "stripeSubscriptionId": "sub_...",
 *   "stripeSessionId": "cs_...",
 *   "signerName": "John Doe",
 *   "signerEmail": "john@acme.com",
 *   "ip": "optional",
 *   "userAgent": "optional"
 * }
 */

const ALLOWED_PLANS = new Set(["bronze", "silver", "gold"])

function cleanStr(v) {
  return String(v || "").trim()
}

export async function handler(event) {
  // 🔒 INTERNAL / ADMIN ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  if (event.httpMethod && event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }

  try {
    const body = JSON.parse(event.body || "{}")

    const contractId = cleanStr(body.contractId)
    const brandName = cleanStr(body.brandName)
    const plan = cleanStr(body.plan).toLowerCase()

    if (!contractId || !brandName || !ALLOWED_PLANS.has(plan)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Invalid contract payload" })
      }
    }

    // Stripe refs are optional (but recommended)
    const stripeCustomerId = cleanStr(body.stripeCustomerId)
    const stripeSubscriptionId = cleanStr(body.stripeSubscriptionId)
    const stripeSessionId = cleanStr(body.stripeSessionId)

    const signerName = cleanStr(body.signerName) || "Electronic Signer"
    const signerEmail = cleanStr(body.signerEmail) || null

    const now = Date.now()

    // Storage
    const contracts = (await getStore("contracts")) || []

    // ✅ Idempotent: if already signed, return existing
    const existing = contracts.find(c => c.contractId === contractId)
    if (existing?.signed === true) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          alreadySigned: true,
          contractId,
          signedAt: existing.signedAt
        })
      }
    }

    // Create or update record
    const record = existing || {
      id: `CTR-${contractId}`,
      contractId,
      createdAt: now
    }

    record.type = "sponsor"
    record.brandName = brandName
    record.plan = plan

    record.stripeCustomerId = stripeCustomerId || record.stripeCustomerId || null
    record.stripeSubscriptionId =
      stripeSubscriptionId || record.stripeSubscriptionId || null
    record.stripeSessionId = stripeSessionId || record.stripeSessionId || null

    record.signed = true
    record.signedAt = now
    record.signerName = signerName
    record.signerEmail = signerEmail

    // Optional request metadata (don’t trust it for security decisions)
    record.signIp =
      cleanStr(body.ip) ||
      cleanStr(event.headers["x-nf-client-connection-ip"]) ||
      cleanStr(event.headers["x-forwarded-for"]) ||
      null

    record.signUserAgent =
      cleanStr(body.userAgent) || cleanStr(event.headers["user-agent"]) || null

    // Upsert
    const idx = contracts.findIndex(c => c.contractId === contractId)
    if (idx === -1) contracts.unshift(record)
    else contracts[idx] = record

    await setStore("contracts", contracts)

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        contractId,
        signedAt: now
      })
    }
  } catch (err) {
    console.error("sign-contract error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Internal Server Error" })
    }
  }
}
