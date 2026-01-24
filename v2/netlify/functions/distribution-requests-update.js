import { loadItems, saveItems, nowISO } from "./_tkfm_distribution_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

const ALLOWED_STATUS = new Set(["submitted","needs_info","approved","scheduled","published","rejected"]);
const CONTRACT_STATUS = new Set(["unsigned","sent","signed"]);

function sanitizeLinks(obj){
  const src = (obj && typeof obj === "object") ? obj : {};
  return {
    spotify: String(src.spotify || "").trim(),
    apple: String(src.apple || "").trim(),
    youtube: String(src.youtube || "").trim(),
    other: String(src.other || "").trim(),
  };
}

function trim(s,n){ return String(s||"").trim().slice(0,n); }
function clampNum(n, lo, hi){
  const x = Number(n);
  if(!Number.isFinite(x)) return null;
  return Math.max(lo, Math.min(hi, x));
}

export async function handler(event) {
  if (isOptions(event)) return json(200, { ok: true });

  const method = (event.httpMethod || "GET").toUpperCase();
  if (method !== "POST") return bad(405, "POST required");

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return bad(400, "Invalid JSON"); }

  const id = String(body.id || "").trim();
  const patch = (body.patch && typeof body.patch === "object") ? body.patch : null;
  if (!id || !patch) return bad(400, "id and patch required");

  const items = loadItems();
  const idx = (Array.isArray(items) ? items : []).findIndex(x => x && x.id === id);
  if (idx < 0) return bad(404, "not_found", { id });

  const cur = items[idx];
  const next = { ...cur };

  if (typeof patch.contract_status === "string") {
    const cs = patch.contract_status.trim();
    if (CONTRACT_STATUS.has(cs)) next.contract_status = cs;
    if (cs === "sent" && !next.contract_sent_at) next.contract_sent_at = nowISO();
    if (cs === "signed") next.contract_signed_at = nowISO();
  }
  if (typeof patch.contract_url === "string") next.contract_url = trim(patch.contract_url, 500);

  if (patch.artist_split !== undefined) {
    const v = clampNum(patch.artist_split, 0, 100);
    if (v !== null) next.artist_split = v;
  }
  if (patch.tkfm_split !== undefined) {
    const v = clampNum(patch.tkfm_split, 0, 100);
    if (v !== null) next.tkfm_split = v;
  }
  if (typeof next.artist_split === "number" && typeof next.tkfm_split === "number") {
    const sum = next.artist_split + next.tkfm_split;
    if (sum !== 100) next.tkfm_split = Math.max(0, 100 - next.artist_split);
  }
  if (patch.admin_fee !== undefined) {
    const v = clampNum(patch.admin_fee, 0, 1000000);
    if (v !== null) next.admin_fee = v;
  }

  if (typeof patch.status === "string") {
    const s = patch.status.trim();
    if (ALLOWED_STATUS.has(s)) {
      if ((s === "scheduled" || s === "published") && String(next.contract_status || "unsigned") !== "signed") {
        return bad(400, "contract_not_signed", { want_status: s, contract_status: next.contract_status || "unsigned" });
      }
      next.status = s;
    }
  }

  if (typeof patch.owner_notes === "string") next.owner_notes = patch.owner_notes;
  if (typeof patch.client_message === "string") next.client_message = patch.client_message;
  if (patch.publish_links) next.publish_links = sanitizeLinks(patch.publish_links);

  next.updated_at = nowISO();

  const out = items.slice();
  out[idx] = next;
  saveItems(out);

  return ok({ item: next });
}
