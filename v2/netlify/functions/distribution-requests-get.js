import { loadItems } from "./_tkfm_distribution_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

export async function handler(event) {
  if(isOptions(event)) return json(200, { ok:true });

  const method = (event.httpMethod || "GET").toUpperCase();
  if(method !== "GET") return bad(405, "GET required");

  const params = event.queryStringParameters || {};
  const id = String(params.id || "").trim();
  if(!id) return bad(400, "id required");

  const items = loadItems();
  const item = (Array.isArray(items) ? items : []).find(x=>x && x.id === id);
  if(!item) return bad(404, "not_found", { id });

  return ok({ item });
}
