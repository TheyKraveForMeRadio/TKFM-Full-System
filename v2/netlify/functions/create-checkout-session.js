import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");


// TKFM_STRIPE_LOOKUP_FALLBACK
async function tkfmResolvePriceId(planId) {
  const id = (planId || '').trim();
  if (!id) return null;

  // Prefer explicit env mapping first
  const mapped = (typeof PRICE_MAP !== 'undefined' && PRICE_MAP && PRICE_MAP[id]) ? String(PRICE_MAP[id]).trim() : '';

// TKFM: If your checkout handler assigns priceId via PRICE_MAP[planId], replace with:
// const priceId = await tkfmResolvePriceId(planId);
  if (mapped) return mapped;

  // Fallback: resolve by Stripe lookup_key (Price lookup key == planId)
  try {
    const out = await stripe.prices.list({ active: true, lookup_keys: [id], limit: 1 });
    const p = out && out.data && out.data[0] ? out.data[0] : null;
    if (p && p.id) return p.id;
  } catch (e) {
    // ignore; handled by caller
  }
  return null;
}

/**
 * TKFM create-checkout-session (ESM)
 * - Robust planId parsing + aliases
 * - Accepts direct Stripe price ids (price_...)
 * - Retrieves Price to auto-select mode (subscription vs payment)
 * - Uses ONLY `customer` (never customer_email at same time)
 * - Success routes to /post-checkout.html with session_id + planId
 */
function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST,OPTIONS",
    },
    body: JSON.stringify(obj),
  };
}

function getOrigin(headers = {}) {
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [String(k).toLowerCase(), v]));
  // Prefer explicit Origin when present
  if (h.origin) return h.origin;
  const proto = h["x-forwarded-proto"] || "https";
  const host = h["x-forwarded-host"] || h.host;
  if (host) return `${proto}://${host}`;
  return "https://www.tkfmradio.com";
}

function normalizeKey(s) {
  return String(s || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function envGetFirst(names) {
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}

function resolvePriceId(planIdRaw) {
  const planId = String(planIdRaw || "").trim();
  if (!planId) return { ok: false, error: "Missing planId" };

  // Direct Stripe price id support
  if (/^price_[A-Za-z0-9]+$/.test(planId)) return { ok: true, planId, priceId: planId };

  // Known aliases (legacy → canonical)
  const alias = {
    // Video lane
    video_monthly_visuals: "video_monthly_visuals",
    visuals_monthly: "video_monthly_visuals",

    // Creator pass (example)
    video_creator_pass_monthly: "video_creator_pass_monthly",
    creator_pass_monthly: "creator_pass_monthly",

    // Social lane
    social_starter_monthly: "social_starter_monthly",

    // Sponsor lane
    sponsor_autopilot_monthly: "sponsor_autopilot_monthly",
    starter_sponsor_monthly: "starter_sponsor_monthly",
    city_sponsor_monthly: "city_sponsor_monthly",
    takeover_sponsor_monthly: "takeover_sponsor_monthly",
    takeover_viral_monthly: "takeover_viral_monthly",

    // Submission packs
    priority_submission_pack: "priority_submission_pack",
    playlist_pitch_pack: "playlist_pitch_pack",
    press_run_pack: "press_run_pack",
    radio_interview_slot: "radio_interview_slot",

    // AI/Label lane
    ai_radio_intro: "ai_radio_intro",
    ai_feature_verse_kit: "ai_feature_verse_kit",
    ai_label_brand_pack: "ai_label_brand_pack",

    // DJ / Mixtape lane
    mixtape_hosting_starter: "mixtape_hosting_starter",
    mixtape_hosting_pro: "mixtape_hosting_pro",
    mixtape_hosting_elite: "mixtape_hosting_elite",
  };

  const canonical = alias[planId] || planId;

  const norm = normalizeKey(canonical);

  // Candidate env var names
  const candidates = [
    `STRIPE_PRICE_${norm}`,
    // Common special cases / legacy
    `STRIPE_PRICE_AI_${norm}`,
    `STRIPE_PRICE_LABEL_${norm}`,
    `STRIPE_PRICE_VIDEO_${norm}`,
  ];

  const priceId = envGetFirst(candidates);
  if (!priceId) {
    return {
      ok: false,
      error: `Missing Stripe env mapping for planId "${planId}" (tried ${candidates.join(", ")})`,
    };
  }
  return { ok: true, planId: canonical, priceId };
}

async function getOrCreateCustomer(email) {
  const em = String(email || "").trim();
  if (!em) return "";
  const existing = await stripe.customers.list({ email: em, limit: 1 });
  if (existing.data && existing.data[0]) return existing.data[0].id;
  const created = await stripe.customers.create({ email: em });
  return created.id;
}

export async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
    if (event.httpMethod !== "POST") return json(405, { ok: false, error: "Method not allowed" });

    if (!process.env.STRIPE_SECRET_KEY || !String(process.env.STRIPE_SECRET_KEY).startsWith("sk_")) {
      return json(500, { ok: false, error: "STRIPE_SECRET_KEY missing or invalid" });
    }

    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      body = {};
    }

    const planId =
      body.planId ||
      body.plan ||
      body.feature ||
      body.id ||
      body.lookupKey ||
      body.lookup_key ||
      "";

    const email = body.email || body.customer_email || "";

    const origin = getOrigin(event.headers || {});

    const resolved = resolvePriceId(planId);
    if (!resolved.ok) return json(400, { ok: false, error: resolved.error });

    // Retrieve price to determine mode
    let price;
    try {
      price = await stripe.prices.retrieve(resolved.priceId);
    } catch (e) {
      return json(400, {
        ok: false,
        error: `Could not retrieve price "${resolved.priceId}". Check env var mapping and Stripe mode/account.`,
        stripeMessage: e?.message || String(e),
      });
    }

    const mode = price.recurring ? "subscription" : "payment";

    const successUrl =
      `${origin}/post-checkout.html` +
      `?session_id={CHECKOUT_SESSION_ID}` +
      `&planId=${encodeURIComponent(resolved.planId)}`;

    const cancelUrl = `${origin}/pricing.html`;

    const sessionParams = {
      mode,
      line_items: [{ price: resolved.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: { planId: String(resolved.planId) },
    };

    // IMPORTANT: Stripe allows only ONE of customer or customer_email
    if (email) {
      const customerId = await getOrCreateCustomer(email);
      if (customerId) sessionParams.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return json(200, { ok: true, url: session.url });
  } catch (e) {
    return json(500, { ok: false, error: "Server error", stripeMessage: e?.message || String(e) });
  }
}
