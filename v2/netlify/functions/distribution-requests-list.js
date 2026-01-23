import { loadItems } from "./_tkfm_distribution_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

function ownerKeyOk(event) {
  const want = process.env.TKFM_OWNER_KEY || process.env.OWNER_KEY || "";
  if (!want) return true; // dev-friendly
  const got = (event.headers && (event.headers["x-tkfm-owner-key"] || event.headers["X-TKFM-OWNER-KEY"])) || "";
  return String(got) === String(want);
}

export async function handler(event) {
  if(isOptions(event)) return json(200, { ok:true });

  const method = (event.httpMethod || "GET").toUpperCase();
  if(method !== "GET") return bad(405, "GET required");

  const params = event.queryStringParameters || {};
  const limit = Math.max(1, Math.min(1000, parseInt(params.limit || "200", 10) || 200));
  const email = String(params.email || "").trim().toLowerCase();

  const items = loadItems();
  const list = (Array.isArray(items) ? items : []);

  // If email is provided, return only that email's items
  if (email) {
    const out = list.filter(it => String(it.email||"").trim().toLowerCase() === email).slice(0, limit);
    return ok({ scope: "email", email, items: out });
  }

  // If no email, owner key required IF configured (otherwise dev allows)
  if (!ownerKeyOk(event)) {
    return bad(403, "owner_key_required_or_use_email_filter");
  }

  return ok({ scope: "owner", items: list.slice(0, limit) });
}
