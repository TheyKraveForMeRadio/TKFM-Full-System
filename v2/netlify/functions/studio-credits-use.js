import { readJson, writeJson, creditsPath } from "./_tkfm_store_studio.js";
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
    const amount = Number(body.amount||1);
    if(!customerId) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_CUSTOMER_ID" }) };
    if(!Number.isFinite(amount) || amount<=0) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"BAD_AMOUNT" }) };
    const p = creditsPath(customerId);
    const data = readJson(p, { customerId, credits: 0 });
    data.credits = Number(data.credits||0);
    if(data.credits < amount) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"INSUFFICIENT_CREDITS", credits: data.credits }) };
    data.credits -= amount;
    writeJson(p, data);
    return { statusCode:200, headers, body: JSON.stringify({ ok:true, customerId, credits: data.credits }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e.message }) };
  }
}
