import { readJson, writeJson, requestsPath, nowIso } from "./_tkfm_store_studio.js";
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-tkfm-owner-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json"
};

export async function handler(event){
  if(event.httpMethod === "OPTIONS") return { statusCode:200, headers, body:"" };
  try{
    const body = JSON.parse(event.body || "{}");
    const customerId = String(body.customerId||"").trim();
    const id = String(body.id||"").trim();
    const kind = String(body.kind||"upload").trim();
    const title = String(body.title||"").trim();
    const url = String(body.url||"").trim();

    if(!customerId) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_CUSTOMER_ID" }) };
    if(!id) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_ID" }) };
    if(!url) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_URL" }) };

    const p = requestsPath();
    const store = readJson(p, { items: [] });
    const idx = (store.items||[]).findIndex(x=>x && x.id===id);
    if(idx<0) return { statusCode:404, headers, body: JSON.stringify({ ok:false, error:"NOT_FOUND" }) };

    const item = store.items[idx];
    if(String(item.customerId||"").trim() !== customerId) return { statusCode:401, headers, body: JSON.stringify({ ok:false, error:"NOT_YOURS" }) };

    item.uploads = Array.isArray(item.uploads) ? item.uploads : [];
    item.uploads.unshift({ at: nowIso(), kind: kind||"upload", title: title||"", url });
    item.updatedAt = nowIso();

    store.items[idx] = item;
    writeJson(p, store);

    return { statusCode:200, headers, body: JSON.stringify({ ok:true, id, uploads: item.uploads.slice(0, 20) }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e.message }) };
  }
}
