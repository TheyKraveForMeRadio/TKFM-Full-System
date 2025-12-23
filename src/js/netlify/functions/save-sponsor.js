import { v4 as uuidv4 } from "uuid"
import { getStore, setStore } from "./_helpers.js"

const PLANS = new Set(["starter", "pro", "elite"])

function cleanStr(v) {
  return String(v || "").trim()
}

function normCategory(v) {
  return cleanStr(v).toLowerCase()
}

export async function handler(event) {
  // 🔒 INTERNAL / ADMIN ONLY
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  try {
    const body = JSON.parse(event.body || "{}")

    const brandName = cleanStr(body.brandName)
    const category = normCategory(body.category)
    const logoUrl = cleanStr(body.logoUrl)
    const website = cleanStr(body.website)
    const plan = cleanStr(body.plan).toLowerCase()

    if (!brandName || !category || !PLANS.has(plan)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Invalid sponsor data" })
      }
    }

    const sponsors = (await getStore("sponsors")) || []

    // 🔒 LOCK ONE ACTIVE SPONSOR PER CATEGORY (case-insensitive)
    const taken = sponsors.find(
      s => (s.active === true) && normCategory(s.category) === category
    )

    if (taken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Category already taken" })
      }
    }

    const sponsor = {
      id: uuidv4(),
      name: brandName,
      category,
      logoUrl: logoUrl || null,
      link: website || null,
      createdAt: Date.now(),

      active: true,
      tier: plan, // starter | pro | elite
      impressions: 0,
      clicks: 0
    }

    sponsors.unshift(sponsor)
    await setStore("sponsors", sponsors)

    // ✅ Return only safe fields
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        sponsor: {
          id: sponsor.id,
          name: sponsor.name,
          category: sponsor.category,
          tier: sponsor.tier,
          logoUrl: sponsor.logoUrl,
          link: sponsor.link,
          active: sponsor.active,
          createdAt: sponsor.createdAt
        }
      })
    }
  } catch (err) {
    console.error("Sponsor create error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Internal Server Error" })
    }
  }
}
