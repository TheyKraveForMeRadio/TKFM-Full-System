import { readJson, writeJson, sponsorRequestsPath, nowIso, makeId } from "./_tkfm_store_sponsor.js";

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
    const brandName = (body.brandName || "").trim();
    const readLength = (body.readLength || "30s").trim();
    const cta = (body.cta || "").trim();
    const pronounce = (body.pronounce || "").trim();
    const script = (body.script || "").trim();
    const link = (body.link || "").trim();

    if(!customerId) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"MISSING_CUSTOMER_ID" }) };
    if(!brandName || !script) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"MISSING_FIELDS" }) };

    const p = sponsorRequestsPath();
    const store = readJson(p, { items: [] });
    store.items = Array.isArray(store.items) ? store.items : [];

    const id = makeId("srr");
    const now = nowIso();

    const item = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "new",
      customerId,
      brandName,
      readLength,
      cta,
      pronounce,
      script,
      link,
      scheduledDate: "",
      ownerNotes: ""
    };

    store.items.unshift(item);
    writeJson(p, store);

    return { statusCode: 200, headers, body: JSON.stringify({ ok:true, id, status: item.status }) };
  }catch(e){
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
