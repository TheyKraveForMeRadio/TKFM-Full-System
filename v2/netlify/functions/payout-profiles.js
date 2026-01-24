import { loadProfiles, saveProfiles } from "./_tkfm_payout_profiles_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";
import { authEnabled, verifyBearer, emailFromPayload, requireOwner } from "./_tkfm_auth.mjs";

function lower(s){ return String(s||"").trim().toLowerCase(); }
function trim(s,n){ return String(s||"").trim().slice(0,n); }

function maskProfile(p){
  if(!p) return null;
  const out = { ...p };
  if(out.payout_method === "ACH"){
    if(out.ach_account_last4) out.ach_account_last4 = String(out.ach_account_last4).slice(-4);
    if(out.ach_routing_last4) out.ach_routing_last4 = String(out.ach_routing_last4).slice(-4);
  }
  return out;
}

export async function handler(event){
  if(isOptions(event)) return json(200,{ok:true});
  const method = (event.httpMethod||"GET").toUpperCase();

  if(method === "GET"){
    const params = event.queryStringParameters || {};
    const email = lower(params.email || "");
    const limit = Math.max(1, Math.min(5000, parseInt(params.limit||"200",10)||200));

    const store = loadProfiles();
    const profiles = store.profiles || {};

    if(email){
      if(authEnabled()){
        const v = verifyBearer(event);
        if(!v.ok) return bad(401, v.error, { detail: v.detail || "" });
        const tokEmail = emailFromPayload(v.payload);
        if(tokEmail !== email) return bad(403, "email_mismatch");
      }
      const p = profiles[email] || null;
      return ok({ scope:"email", email, profile: maskProfile(p) });
    }

    if(!requireOwner(event)) return bad(403, "owner_key_required");

    const keys = Object.keys(profiles).slice(0, limit);
    const items = keys.map(e => ({ email: e, profile: maskProfile(profiles[e]) }));
    return ok({ scope:"owner", items });
  }

  if(method === "POST"){
    let body = {};
    try{ body = JSON.parse(event.body||"{}"); }catch(e){ return bad(400, "Invalid JSON"); }

    const email = lower(body.email || "");
    if(!email) return bad(400, "email required");

    if(authEnabled()){
      const v = verifyBearer(event);
      if(!v.ok) return bad(401, v.error, { detail: v.detail || "" });
      const tokEmail = emailFromPayload(v.payload);
      if(tokEmail !== email) return bad(403, "email_mismatch");
    }

    const payout_method = trim(body.payout_method, 20);
    if(!payout_method) return bad(400, "payout_method required");

    const store = loadProfiles();
    store.profiles = store.profiles || {};

    const profile = {
      payout_method,
      payout_handle: trim(body.payout_handle, 140),
      ach_account_last4: trim(body.ach_account_last4, 8),
      ach_routing_last4: trim(body.ach_routing_last4, 8),
      payee_name: trim(body.payee_name, 80),
      updated_at: new Date().toISOString()
    };

    store.profiles[email] = profile;
    const saved = saveProfiles(store);

    return ok({ backend: saved.backend, email, profile: maskProfile(profile) });
  }

  return bad(405, "method_not_allowed");
}
