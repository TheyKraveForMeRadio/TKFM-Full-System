import Stripe from "stripe"
import { getStore, setStore } from "./_helpers.js"
import { v4 as uuidv4 } from "uuid"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
})

function cleanStr(v) {
  return String(v || "").trim()
}

export async function handler(event) {
  const sig = event.headers["stripe-signature"]

  let stripeEvent
  try {
    // IMPORTANT: event.body must be the raw string Netlify provides
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error("Stripe webhook signature error:", err.message)
    return { statusCode: 400, body: "Webhook Error" }
  }

  try {
    const type = stripeEvent.type
    const obj = stripeEvent.data?.object

    // ✅ Optional: store processed event IDs to prevent duplicates (idempotency)
    const processed = (await getStore("stripe_events")) || []
    if (processed.includes(stripeEvent.id)) {
      return { statusCode: 200, body: "OK (duplicate ignored)" }
    }

    // --- HANDLE CHECKOUT COMPLETED ---
    if (type === "checkout.session.completed") {
      const session = obj

      const meta = session.metadata || {}
      const metaType = cleanStr(meta.type).toLowerCase()

      // ✅ SPONSOR PURCHASE FLOW
      if (metaType === "sponsor") {
        const sponsors = (await getStore("sponsors")) || []

        const name = cleanStr(meta.name)
        const logoUrl = cleanStr(meta.logoUrl)
        const link = cleanStr(meta.link)
        const tier = cleanStr(meta.tier).toLowerCase()

        // subscription id exists for subscription-mode checkouts
        const stripeSubId = cleanStr(session.subscription)

        if (!name || !tier || !stripeSubId) {
          console.warn("Sponsor checkout missing metadata:", { name, tier, stripeSubId })
        } else {
          // ✅ Idempotent: don’t create duplicate sponsor for same subscription
          const existing = sponsors.find(s => s.stripeSubId === stripeSubId)

          if (!existing) {
            sponsors.unshift({
              id: uuidv4(),
              name,
              logoUrl: logoUrl || null,
              link: link || null,
              tier,
              impressions: 0,
              clicks: 0,
              active: true,
              stripeSubId,
              stripeCustomerId: cleanStr(session.customer) || null,
              createdAt: Date.now()
            })
            await setStore("sponsors", sponsors)
          } else {
            // if it exists but was inactive, reactivate
            if (existing.active !== true) {
              existing.active = true
              existing.reactivatedAt = Date.now()
              await setStore("sponsors", sponsors)
            }
          }
        }
      }

      // ✅ FEATURE PURCHASE FLOW (optional compatibility)
      // Your other function already handles feature fulfillment; keep this if you want redundancy.
      if (metaType === "feature") {
        // You likely handle this in a separate webhook file already.
        // Leaving this here as a no-op is fine.
      }
    }

    // --- HANDLE SUBSCRIPTION CANCELED ---
    if (type === "customer.subscription.deleted") {
      const sub = obj
      const subId = cleanStr(sub.id)

      const sponsors = (await getStore("sponsors")) || []
      let changed = false

      sponsors.forEach(s => {
        if (s.stripeSubId === subId) {
          s.active = false
          s.disabledAt = Date.now()
          s.disabledReason = "subscription_deleted"
          changed = true
        }
      })

      if (changed) await setStore("sponsors", sponsors)
    }

    // --- HANDLE SUBSCRIPTION UPDATED (PAST_DUE, UNPAID, CANCELED, ACTIVE) ---
    if (type === "customer.subscription.updated") {
      const sub = obj
      const subId = cleanStr(sub.id)
      const status = cleanStr(sub.status).toLowerCase()

      const sponsors = (await getStore("sponsors")) || []
      let changed = false

      sponsors.forEach(s => {
        if (s.stripeSubId === subId) {
          // mark active only when Stripe says active/trialing
          const shouldBeActive = status === "active" || status === "trialing"
          if (s.active !== shouldBeActive) {
            s.active = shouldBeActive
            s.lastStripeStatus = status
            s.statusUpdatedAt = Date.now()
            changed = true
          }
        }
      })

      if (changed) await setStore("sponsors", sponsors)
    }

    // ✅ Save processed event id (idempotency)
    processed.unshift(stripeEvent.id)
    // keep list from growing forever
    if (processed.length > 500) processed.length = 500
    await setStore("stripe_events", processed)

    return { statusCode: 200, body: "OK" }
  } catch (err) {
    console.error("Stripe webhook processing error:", err)
    return { statusCode: 500, body: "Internal Error" }
  }
}
