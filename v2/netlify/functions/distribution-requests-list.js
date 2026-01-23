import { loadItems } from "./_tkfm_distribution_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

function ownerOk(event) {
  const want = process.env.TKFM_OWNER_KEY || process.env.OWNER_KEY || "";
  if (!want) return true;
  const got = (event.headers && (event.headers["x-tkfm-owner-key"] || event.headers["X-TKFM-OWNER-KEY"])) || "";
  return String(got) === String(want);
}

export async function handler(event) {
  if (isOptions(event)) return json(200, { ok: true });

  const method = (event.httpMethod || "GET").toUpperCase();
  if (method !== "GET") return bad(405, "GET required");

  const params = event.queryStringParameters || {};
  const limit = Math.max(1, Math.min(1000, parseInt(params.limit || "200", 10) || 200));
  const email = String(params.email || "").trim().toLowerCase();

  const items = loadItems();
  const list = (Array.isArray(items) ? items : []);

  if (email) {
    const out = list
      .filter(it => String(it.email || "").trim().toLowerCase() === email)
      .sort((a,b)=>(String(b.updated_at||b.created_at||"")).localeCompare(String(a.updated_at||a.created_at||"")))
      .slice(0, limit);
    return ok({ scope: "email", email, items: out });
  }

  if (!ownerOk(event)) return bad(403, "owner_key_required_or_use_email_filter");

  const out = list
    .sort((a,b)=>(String(b.updated_at||b.created_at||"")).localeCompare(String(a.updated_at||a.created_at||"")))
    .slice(0, limit);

  return ok({ scope: "owner", items: out });
}
