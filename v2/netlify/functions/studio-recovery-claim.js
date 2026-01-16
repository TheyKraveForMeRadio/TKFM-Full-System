import { readRecovery, writeRecovery, nowIso } from "./_tkfm_store_studio_recovery.js";
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-tkfm-owner-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json"
};

const MAX_USES = 50;

export async function handler(event){
  if(event.httpMethod === "OPTIONS") return { statusCode:200, headers, body:"" };
  if(event.httpMethod !== "POST") return { statusCode:405, headers, body: JSON.stringify({ ok:false, error:"METHOD_NOT_ALLOWED" }) };

  try{
    const body = JSON.parse(event.body || "{}");
    const code = String(body.code || "").trim().toUpperCase();
    if(!code) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_CODE" }) };

    const store = readRecovery();
    store.codes = (store.codes && typeof store.codes === "object") ? store.codes : {};

    const item = store.codes[code];
    if(!item || !item.customerId){
      return { statusCode:404, headers, body: JSON.stringify({ ok:false, error:"CODE_NOT_FOUND" }) };
    }

    item.uses = Number(item.uses || 0) + 1;
    item.lastUsedAt = nowIso();

    if(item.uses > MAX_USES){
      delete store.codes[code];
      writeRecovery(store);
      return { statusCode:410, headers, body: JSON.stringify({ ok:false, error:"CODE_EXPIRED" }) };
    }

    store.codes[code] = item;
    writeRecovery(store);

    return { statusCode:200, headers, body: JSON.stringify({ ok:true, customerId: String(item.customerId) }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e.message }) };
  }
}
