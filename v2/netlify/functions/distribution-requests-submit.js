import { loadItems, saveItems, uid, nowISO } from "./_tkfm_distribution_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

export async function handler(event) {
  if(isOptions(event)) return json(200, { ok:true });

  const method = (event.httpMethod || "GET").toUpperCase();
  if(method !== "POST") return bad(405, "POST required");

  let body = {};
  try{ body = JSON.parse(event.body || "{}"); }catch(e){ return bad(400, "Invalid JSON"); }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const project_title = String(body.project_title || "").trim();
  const contract_ack = !!body.contract_ack;

  if(!name || !email || !project_title) return bad(400, "Missing required fields: name, email, project_title");
  if(!contract_ack) return bad(400, "contract_ack required");

  const item = {
    id: uid(),
    created_at: nowISO(),
    updated_at: nowISO(),
    status: "submitted",

    name,
    email,
    role: String(body.role || "artist"),
    release_type: String(body.release_type || "single"),
    project_title,
    primary_artist: String(body.primary_artist || "").trim(),
    genre: String(body.genre || "").trim(),
    release_date: String(body.release_date || "").trim(),
    tracklist: String(body.tracklist || ""),
    asset_urls: Array.isArray(body.asset_urls) ? body.asset_urls.slice(0, 50).map(x=>String(x).trim()).filter(Boolean) : [],
    dsp_targets: Array.isArray(body.dsp_targets) ? body.dsp_targets.slice(0, 50).map(x=>String(x)) : [],
    addons: Array.isArray(body.addons) ? body.addons.slice(0, 50).map(x=>String(x)) : [],

    owner_notes: "",
    client_message: "",
    publish_links: { spotify:"", apple:"", youtube:"", other:"" },
  };

  const items = loadItems();
  const next = [item, ...(Array.isArray(items) ? items : [])].slice(0, 2000);
  const saved = saveItems(next);

  return ok({ id: item.id, backend: saved.backend });
}
