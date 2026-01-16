import { readJson, sponsorCreditsPath, writeJson } from "./_tkfm_store_sponsor.js";

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
  try{
    const body = JSON.parse(event.body || "{}");
    const customerId = (body.customerId || "").trim();
    if(!customerId) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"MISSING_CUSTOMER_ID" }) };

    const p = sponsorCreditsPath(customerId);
    const data = readJson(p, { customerId, credits: 0 });
    if(typeof data.credits !== "number") data.credits = 0;
    writeJson(p, data);

    return { statusCode: 200, headers, body: JSON.stringify({ ok:true, customerId, credits: data.credits }) };
  }catch(e){
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
