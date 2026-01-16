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
    const title = String(body.title||"").trim();
    const url = String(body.url||"").trim();
    const note = String(body.note||"").trim();
    const setStatus = String(body.setStatus||"").trim();

    if(!id) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_ID" }) };
    if(!url) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_URL" }) };

    const p = requestsPath();
    const store = readJson(p, { items: [] });
    const idx = (store.items||[]).findIndex(x=>x && x.id===id);
    if(idx<0) return { statusCode:404, headers, body: JSON.stringify({ ok:false, error:"NOT_FOUND" }) };

    const item = store.items[idx];
    item.deliverables = Array.isArray(item.deliverables) ? item.deliverables : [];
    item.deliverables.unshift({ at: nowIso(), title: title||"Deliverable", url, note: note||"" });
    if(setStatus) item.status = setStatus;
    item.updatedAt = nowIso();

    store.items[idx] = item;
    writeJson(p, store);

    return { statusCode:200, headers, body: JSON.stringify({ ok:true, id, deliverables: item.deliverables.slice(0, 20), status: item.status }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e.message }) };
  }
}
