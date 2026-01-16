import { readJson, writeJson, requestsPath, nowIso } from "./_tkfm_store_studio.js";
import { isOwner, ownerDeny } from "./_tkfm_owner_check.js";
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-tkfm-owner-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json"
};

export async function handler(event){
  if(event.httpMethod === "OPTIONS") return { statusCode:200, headers, body:"" };
  if(!isOwner(event)){
    const deny = ownerDeny();
    deny.headers = Object.assign({}, headers, deny.headers);
    return deny;
  }
  try{
    const body = JSON.parse(event.body || "{}");
    const id = String(body.id||"").trim();
    if(!id) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_ID" }) };
    const p = requestsPath();
    const store = readJson(p, { items: [] });
    const idx = (store.items||[]).findIndex(x=>x && x.id===id);
    if(idx<0) return { statusCode:404, headers, body: JSON.stringify({ ok:false, error:"NOT_FOUND" }) };

    const item = store.items[idx];
    item.status = String(body.status||item.status||"new").trim();
    item.scheduledDate = String(body.scheduledDate||item.scheduledDate||"").trim();
    item.ownerNotes = String(body.ownerNotes||item.ownerNotes||"").trim();
    item.updatedAt = nowIso();

    store.items[idx] = item;
    writeJson(p, store);

    return { statusCode:200, headers, body: JSON.stringify({ ok:true, id, status: item.status }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e.message }) };
  }
}
