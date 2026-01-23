import { loadItems, saveItems, nowISO } from "./_tkfm_distribution_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

const ALLOWED_STATUS = new Set(["submitted","needs_info","approved","scheduled","published","rejected"]);

function sanitizeLinks(obj){
  const src = (obj && typeof obj === "object") ? obj : {};
  return {
    spotify: String(src.spotify || "").trim(),
    apple: String(src.apple || "").trim(),
    youtube: String(src.youtube || "").trim(),
    other: String(src.other || "").trim(),
  };
}

export async function handler(event) {
  if(isOptions(event)) return json(200, { ok:true });

  const method = (event.httpMethod || "GET").toUpperCase();
  if(method !== "POST") return bad(405, "POST required");

  let body = {};
  try{ body = JSON.parse(event.body || "{}"); }catch(e){ return bad(400, "Invalid JSON"); }

  const id = String(body.id || "").trim();
  const patch = (body.patch && typeof body.patch === "object") ? body.patch : null;
  if(!id || !patch) return bad(400, "id and patch required");

  const items = loadItems();
  const idx = (Array.isArray(items) ? items : []).findIndex(x=>x && x.id === id);
  if(idx < 0) return bad(404, "not_found", { id });

  const cur = items[idx];
  const next = { ...cur };

  if(typeof patch.status === "string"){
    const s = patch.status.trim();
    if(ALLOWED_STATUS.has(s)) next.status = s;
  }
  if(typeof patch.owner_notes === "string") next.owner_notes = patch.owner_notes;
  if(typeof patch.client_message === "string") next.client_message = patch.client_message;
  if(patch.publish_links) next.publish_links = sanitizeLinks(patch.publish_links);

  next.updated_at = nowISO();

  const out = items.slice();
  out[idx] = next;
  saveItems(out);

  return ok({ item: next });
}
