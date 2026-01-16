import { readJson, requestsPath } from "./_tkfm_store_studio.js";
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
    const p = requestsPath();
    const store = readJson(p, { items: [] });
    const items = Array.isArray(store.items) ? store.items.slice(0, 300) : [];
    return { statusCode:200, headers, body: JSON.stringify({ ok:true, items }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e.message }) };
  }
}
