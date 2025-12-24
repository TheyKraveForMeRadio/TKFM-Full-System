import { getStripe, json, corsPreflight } from "./_stripe.js";
import { LOOKUP_KEYS } from "./_price-lookup.js";

export async function handler(event) {
  const pre = corsPreflight(event);
  if (pre) return pre;

  try {
    const { key, successUrl, cancelUrl } = JSON.parse(event.body || "{}");

    if (!key || !LOOKUP_KEYS[key]) {
      return json(400, { error: "Invalid subscription key" });
    }

    const stripe = getStripe();

    const lookupKey = LOOKUP_KEYS[key];
    const prices = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    const price = prices.data?.[0];
    if (!price || !price.recurring) {
      return json(404, { error: `No active recurring Stripe price for lookup_key: ${lookupKey}` });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: successUrl || "https://tkfmradio.com/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: cancelUrl || "https://tkfmradio.com/",
      metadata: { tkfm_key: key, lookup_key: lookupKey },
    });

    return json(200, { url: session.url, id: session.id });
  } catch (err) {
    return json(500, { error: err?.message || "Server error" });
  }
}
