import { getStripe, json, corsPreflight } from "./_stripe.js";
import { LOOKUP_KEYS } from "./_price-lookup.js";

export async function handler(event) {
  const pre = corsPreflight(event);
  if (pre) return pre;

  try {
    const { keys } = JSON.parse(event.body || "{}");
    const wanted = Array.isArray(keys) ? keys : [];

    // Allowlist
    const lookupKeys = wanted
      .filter((k) => LOOKUP_KEYS[k])
      .map((k) => LOOKUP_KEYS[k]);

    if (!lookupKeys.length) {
      return json(400, { error: "No valid keys provided" });
    }

    const stripe = getStripe();
    const prices = await stripe.prices.list({
      lookup_keys: lookupKeys,
      active: true,
      limit: 100,
      expand: ["data.product"],
    });

    // Return a clean map { lookup_key: { unit_amount, currency, product_name } }
    const out = {};
    for (const p of prices.data) {
      const lk = p.lookup_key;
      out[lk] = {
        id: p.id,
        unit_amount: p.unit_amount,
        currency: p.currency,
        recurring: p.recurring || null,
        product_name: p.product?.name || null,
      };
    }

    return json(200, out);
  } catch (err) {
    return json(500, { error: err?.message || "Server error" });
  }
}
