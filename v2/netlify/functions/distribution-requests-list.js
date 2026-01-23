import { loadItems } from "./_tkfm_distribution_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

export async function handler(event) {
  if(isOptions(event)) return json(200, { ok:true });

  const method = (event.httpMethod || "GET").toUpperCase();
  if(method !== "GET") return bad(405, "GET required");

  const params = event.queryStringParameters || {};
  const limit = Math.max(1, Math.min(1000, parseInt(params.limit || "200", 10) || 200));
  const room = String(params.room || "global");

  const items = loadItems();
  const list = (Array.isArray(items) ? items : []).slice(0, limit);

  return ok({ room, items: list });
}
