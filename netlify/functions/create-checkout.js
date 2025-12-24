import { getStripe, json, corsPreflight } from "./_stripe.js";
import { LOOKUP_KEYS, MODE_BY_KEY } from "./_price-lookup.js";

export async function handler(event) {
  const pre = corsPreflight(event);
  if (pre) return pre;

  try {
    const { key, quantity, successUrl, cancelUrl } = JSON.parse(event.body || "{}");

    if (!key || !LOOKUP_KEYS[key]) {
      return json(400, { error: "Invalid checkout key" });
    }

    const stripe = getStripe();

    // Look up Stripe Price by lookup_key
    const lookupKey = LOOKUP_KEYS[key];
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
      expand: ["data.product"],
    });

    const price = prices.data?.[0];
    if (!price) {
      return json(404, { error: `No active Stripe price found for lookup_key: ${lookupKey}` });
    }

    const mode = MODE_BY_KEY[key] || (price.type === "recurring" ? "subscription" : "payment");

    // Hard safety: don’t allow subscription mode if price is not recurring
    if (mode === "subscription" && !price.recurring) {
      return json(400, { error: "Requested subscription mode but price is not recurring" });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [
        {
          price: price.id,
          quantity: Number.isFinite(quantity) ? quantity : 1,
        },
      ],
      success_url: successUrl || "https://tkfmradio.com/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: cancelUrl || "https://tkfmradio.com/",
      // Optional: tag the purchase
      metadata: { tkfm_key: key, lookup_key: lookupKey },
    });

    return json(200, { url: session.url, id: session.id });
  } catch (err) {
    return json(500, { error: err?.message || "Server error" });
  }
}
