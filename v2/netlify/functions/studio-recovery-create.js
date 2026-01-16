import { readRecovery, writeRecovery, makeCode, nowIso } from "./_tkfm_store_studio_recovery.js";
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-tkfm-owner-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json"
};

const TTL_DAYS = 30;

export async function handler(event){
  if(event.httpMethod === "OPTIONS") return { statusCode:200, headers, body:"" };
  if(event.httpMethod !== "POST") return { statusCode:405, headers, body: JSON.stringify({ ok:false, error:"METHOD_NOT_ALLOWED" }) };

  try{
    const body = JSON.parse(event.body || "{}");
    const customerId = String(body.customerId || "").trim();
    if(!customerId) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_CUSTOMER_ID" }) };

    const store = readRecovery();
    store.codes = (store.codes && typeof store.codes === "object") ? store.codes : {};

    // prune expired
    const now = Date.now();
    for(const k of Object.keys(store.codes)){
      const it = store.codes[k];
      const created = Date.parse(it && it.createdAt ? it.createdAt : "");
      if(!created || (now - created) > TTL_DAYS*24*3600*1000) delete store.codes[k];
    }

    // create new code
    let code = makeCode();
    // avoid collision
    let tries = 0;
    while(store.codes[code] && tries < 10){
      code = makeCode(); tries++;
    }

    store.codes[code] = {
      customerId,
      createdAt: nowIso(),
      lastUsedAt: "",
      uses: 0
    };

    writeRecovery(store);

    return { statusCode:200, headers, body: JSON.stringify({ ok:true, code }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e.message }) };
  }
}
