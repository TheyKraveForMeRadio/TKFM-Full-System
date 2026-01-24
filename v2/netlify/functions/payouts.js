import { loadPayouts, savePayouts, nowISO } from "./_tkfm_payouts_store.mjs";
import { loadProfiles } from "./_tkfm_payout_profiles_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

function ownerOk(event){
  const want = process.env.TKFM_OWNER_KEY || process.env.OWNER_KEY || "";
  if(!want) return true;
  const got = (event.headers && (event.headers["x-tkfm-owner-key"] || event.headers["X-TKFM-OWNER-KEY"])) || "";
  return String(got) === String(want);
}

function lower(s){ return String(s||"").trim().toLowerCase(); }

function attachProfile(items){
  const prof = loadProfiles();
  const map = (prof && prof.profiles) ? prof.profiles : {};
  return (items||[]).map(p=>{
    const email = lower(p.email||"");
    const pr = map[email] || null;
    return { ...p, payout_profile: pr ? {
      payout_method: pr.payout_method || "",
      payout_handle: pr.payout_handle || "",
      ach_account_last4: pr.ach_account_last4 || "",
      ach_routing_last4: pr.ach_routing_last4 || "",
      payee_name: pr.payee_name || "",
      updated_at: pr.updated_at || ""
    } : null };
  });
}

export async function handler(event){
  if(isOptions(event)) return json(200,{ok:true});
  const method=(event.httpMethod||"GET").toUpperCase();

  if(method==="GET"){
    const params=event.queryStringParameters||{};
    const email=lower(params.email||"");
    const limit=Math.max(1, Math.min(5000, parseInt(params.limit||"200",10)||200));
    const store=loadPayouts();
    const items=(store.items||[]);

    if(email){
      const out = items.filter(x=>lower(x.email||"")===email).slice(0,limit);
      return ok({ scope:"email", email, items: attachProfile(out) });
    }

    if(!ownerOk(event)) return bad(403,"owner_key_required_or_use_email_filter");
    return ok({ scope:"owner", items: attachProfile(items.slice(0,limit)) });
  }

  if(method==="POST"){
    if(!ownerOk(event)) return bad(403,"owner_key_required");
    let body={}; try{ body=JSON.parse(event.body||"{}"); }catch(e){ return bad(400,"Invalid JSON"); }

    const id=String(body.id||"").trim();
    const action=String(body.action||"").trim();
    const paid_method=String(body.method||"").trim();
    const note=String(body.note||"").trim();
    if(!id||!action) return bad(400,"id and action required");

    const store=loadPayouts();
    const idx=(store.items||[]).findIndex(x=>x && x.id===id);
    if(idx<0) return bad(404,"not_found");

    const it={...store.items[idx]};
    if(action==="mark_paid"){
      it.status="paid";
      it.paid_at=nowISO();
      it.paid_method=paid_method || it.paid_method || "";
      if(note) it.note=note;
      it.updated_at=nowISO();
    } else if(action==="mark_unpaid"){
      it.status="unpaid";
      it.updated_at=nowISO();
    } else {
      return bad(400,"unknown_action");
    }

    store.items[idx]=it;
    const saved=savePayouts(store);
    return ok({ backend:saved.backend, item: attachProfile([it])[0] });
  }

  return bad(405,"method_not_allowed");
}
