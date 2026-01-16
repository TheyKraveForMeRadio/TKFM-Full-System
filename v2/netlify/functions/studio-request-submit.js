import { readJson, writeJson, requestsPath, nowIso, makeId } from "./_tkfm_store_studio.js";
import { readProfile } from "./_tkfm_store_studio_profile.js";
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
    const engine = String(body.engine||"").trim();
    const cost = Number(body.cost||0);
    const artist = String(body.artist||"").trim();
    const notes = String(body.notes||"").trim();
    const links = String(body.links||"").trim();

    if(!customerId) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_CUSTOMER_ID" }) };
    if(!engine) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_ENGINE" }) };
    if(!Number.isFinite(cost) || cost<=0) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"BAD_COST" }) };
    if(!artist || !notes) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_FIELDS" }) };

    const p = requestsPath();
    const store = readJson(p, { items: [] });
    store.items = Array.isArray(store.items) ? store.items : [];

    const id = makeId("studio");
    const now = nowIso();
    const profile = readProfile(customerId);

    const item = {
      id,
      createdAt: now,
      updatedAt: now,
      status: "new",
      customerId,
      engine,
      cost,
      artist,
      notes,
      links,
      profile: {
        name: String(profile.name||"").trim(),
        email: String(profile.email||"").trim(),
        genre: String(profile.genre||"").trim(),
        ig: String(profile.ig||"").trim(),
        link: String(profile.link||"").trim(),
        city: String(profile.city||"").trim()
      },
      uploads: [],
      deliverables: [],
      ownerNotes: "",
      scheduledDate: ""
    };

    store.items.unshift(item);
    writeJson(p, store);

    return { statusCode:200, headers, body: JSON.stringify({ ok:true, id, status: item.status }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error:e.message }) };
  }
}
