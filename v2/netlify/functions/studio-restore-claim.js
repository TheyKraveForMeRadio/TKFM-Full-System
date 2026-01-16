import { readStore, writeStore, nowIso } from "./_tkfm_store_studio_restore.js";
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-tkfm-owner-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json"
};

const MAX_USES = 25;

export async function handler(event){
  if(event.httpMethod === "OPTIONS") return { statusCode:200, headers, body:"" };
  if(event.httpMethod !== "POST") return { statusCode:405, headers, body: JSON.stringify({ ok:false, error:"METHOD_NOT_ALLOWED" }) };

  try{
    const body = JSON.parse(event.body || "{}");
    const token = String(body.token || "").trim();
    if(!token) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_TOKEN" }) };

    const store = readStore();
    store.tokens = (store.tokens && typeof store.tokens === "object") ? store.tokens : {};

    const it = store.tokens[token];
    if(!it || !it.customerId) return { statusCode:404, headers, body: JSON.stringify({ ok:false, error:"NOT_FOUND" }) };

    it.uses = Number(it.uses || 0) + 1;
    it.lastUsedAt = nowIso();

    if(it.uses > MAX_USES){
      delete store.tokens[token];
      writeStore(store);
      return { statusCode:410, headers, body: JSON.stringify({ ok:false, error:"EXPIRED" }) };
    }

    store.tokens[token] = it;
    writeStore(store);

    return { statusCode:200, headers, body: JSON.stringify({ ok:true, customerId: String(it.customerId), email: String(it.email||"") }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
