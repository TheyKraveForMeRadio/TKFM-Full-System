import { writeProfile } from "./_tkfm_store_studio_profile.js";
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
    if(!customerId) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_CUSTOMER_ID" }) };
    const profile = Object.assign({ customerId, updatedAt: new Date().toISOString() }, body.profile || {});
    writeProfile(customerId, profile);
    return { statusCode:200, headers, body: JSON.stringify({ ok:true, profile }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e.message }) };
  }
}
