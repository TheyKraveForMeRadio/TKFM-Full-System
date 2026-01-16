import { readJson, writeJson, sponsorRequestsPath, nowIso } from "./_tkfm_store_sponsor.js";
import { isOwner, ownerDeny } from "./_tkfm_owner_check.js";

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-tkfm-owner-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json"
};

export async function handler(event){
  if(event.httpMethod === "OPTIONS"){
    return { statusCode: 200, headers, body: "" };
  }
  if(!isOwner(event)){
    const deny = ownerDeny();
    deny.headers = Object.assign({}, headers, deny.headers);
    return deny;
  }
  try{
    const body = JSON.parse(event.body || "{}");
    const id = (body.id || "").trim();
    if(!id) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"MISSING_ID" }) };

    const p = sponsorRequestsPath();
    const store = readJson(p, { items: [] });
    const idx = (store.items||[]).findIndex(x => x && x.id === id);
    if(idx < 0) return { statusCode: 404, headers, body: JSON.stringify({ ok:false, error:"NOT_FOUND" }) };

    const item = store.items[idx];
    item.status = (body.status || item.status || "new").trim();
    item.scheduledDate = (body.scheduledDate || item.scheduledDate || "").trim();
    item.ownerNotes = (body.ownerNotes || item.ownerNotes || "").trim();
    item.updatedAt = nowIso();

    store.items[idx] = item;
    writeJson(p, store);

    return { statusCode: 200, headers, body: JSON.stringify({ ok:true, id, status: item.status }) };
  }catch(e){
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
