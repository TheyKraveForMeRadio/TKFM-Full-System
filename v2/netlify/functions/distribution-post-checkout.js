import Stripe from "stripe";
import { loadItems, saveItems, uid, nowISO } from "./_tkfm_distribution_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

const ALLOWED_LOOKUP = new Set([
  "distribution_single_release",
  "distribution_artist_monthly",
  "distribution_label_monthly"
]);

function trim(s,n){ return String(s||"").trim().slice(0,n); }

export async function handler(event){
  if(isOptions(event)) return json(200, { ok:true });
  const method = (event.httpMethod || "GET").toUpperCase();
  if(method !== "POST") return bad(405, "POST required");

  const sk = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || "";
  if(!sk || !sk.startsWith("sk_")) return bad(500, "stripe_not_configured");

  let body = {};
  try{ body = JSON.parse(event.body || "{}"); }catch(e){ return bad(400, "Invalid JSON"); }

  const session_id = trim(body.session_id, 200);
  const draft = (body.draft && typeof body.draft === "object") ? body.draft : null;
  if(!session_id) return bad(400, "session_id required");
  if(!draft) return bad(400, "draft required");

  const stripe = new Stripe(sk);

  let session;
  try{
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items.data.price"]
    });
  }catch(e){
    return bad(400, "invalid_session", { err: String(e.message || e) });
  }

  if(!session || session.payment_status !== "paid"){
    return bad(400, "not_paid", { payment_status: session ? session.payment_status : null });
  }

  // Find lookup key from the first line item's price
  let lookup = "";
  try{
    const li = (session.line_items && session.line_items.data && session.line_items.data[0]) || null;
    lookup = (li && li.price && li.price.lookup_key) ? String(li.price.lookup_key) : "";
  }catch(e){}
  if(!lookup || !ALLOWED_LOOKUP.has(lookup)){
    return bad(400, "not_distribution_plan", { lookup_key: lookup || null });
  }

  // Build item from draft
  const name = trim(draft.name, 80);
  const email = trim(draft.email, 120);
  const project_title = trim(draft.project_title, 120);
  if(!name || !email || !project_title) return bad(400, "draft_missing_required");

  const item = {
    id: uid(),
    created_at: nowISO(),
    updated_at: nowISO(),
    status: "submitted",

    // client fields
    name,
    email,
    role: trim(draft.role || "artist", 20),
    release_type: trim(draft.release_type || "single", 20),
    project_title,
    primary_artist: trim(draft.primary_artist || "", 80),
    genre: trim(draft.genre || "", 60),
    release_date: trim(draft.release_date || "", 40),
    tracklist: String(draft.tracklist || ""),
    asset_urls: Array.isArray(draft.asset_urls) ? draft.asset_urls.slice(0, 50).map(x=>String(x).trim()).filter(Boolean) : [],
    dsp_targets: Array.isArray(draft.dsp_targets) ? draft.dsp_targets.slice(0, 50).map(x=>String(x)) : [],
    addons: Array.isArray(draft.addons) ? draft.addons.slice(0, 50).map(x=>String(x)) : [],
    contract_ack: !!draft.contract_ack,

    // purchase fields
    purchase_session_id: session_id,
    purchase_lookup_key: lookup,
    customer_email: (session.customer_details && session.customer_details.email) ? String(session.customer_details.email) : "",

    // owner fields
    owner_notes: "",
    client_message: "",
    publish_links: { spotify:"", apple:"", youtube:"", other:"" },
  };

  const items = loadItems();
  const next = [item, ...(Array.isArray(items) ? items : [])].slice(0, 3000);
  saveItems(next);

  return ok({ id: item.id, lookup_key: lookup });
}
