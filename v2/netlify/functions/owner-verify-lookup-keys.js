import Stripe from "stripe";

function clean(v){
  return String(v||"").trim().replace(/^\uFEFF/, "").replace(/^"+|"+$/g, "");
}

function isOwner(event){
  const keyHeader =
    event.headers?.["x-tkfm-owner-key"] ||
    event.headers?.["X-Tkfm-Owner-Key"] ||
    event.headers?.["x-tkfm-owner-key".toUpperCase()] ||
    "";
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : auth;

  const candidate = clean(keyHeader) || clean(bearer);
  const expected = clean(process.env.TKFM_OWNER_KEY || "");
  return !!expected && candidate === expected;
}

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
  if(event.httpMethod !== "POST"){
    return { statusCode: 405, headers, body: JSON.stringify({ ok:false, error:"METHOD_NOT_ALLOWED" }) };
  }
  if(!isOwner(event)){
    return { statusCode: 401, headers, body: JSON.stringify({ ok:false, error:"OWNER_ONLY" }) };
  }

  try{
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if(!stripeKey){
      return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error:"MISSING_STRIPE_SECRET_KEY" }) };
    }
    const stripe = new Stripe(stripeKey);

    const body = JSON.parse(event.body || "{}");
    const keys = Array.isArray(body.lookup_keys) ? body.lookup_keys : [];
    const lookup_keys = keys.map(x=>String(x||"").trim()).filter(Boolean).slice(0, 100);

    if(lookup_keys.length === 0){
      return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"MISSING_LOOKUP_KEYS" }) };
    }

    // Stripe supports listing prices by lookup_keys
    const prices = await stripe.prices.list({ lookup_keys, limit: 100, expand: ["data.product"] });

    const byKey = {};
    for(const p of (prices.data || [])){
      if(p && p.lookup_key){
        byKey[String(p.lookup_key)] = p;
      }
    }

    const results = lookup_keys.map(k=>{
      const p = byKey[k];
      if(!p){
        return { lookup_key: k, found: false };
      }
      const recurring = p.type === "recurring" || !!p.recurring;
      const type = recurring ? "recurring" : "one_time";
      const prod = p.product;
      const product_id = typeof prod === "string" ? prod : (prod && prod.id) ? prod.id : "";
      const product_name = (prod && typeof prod === "object" && prod.name) ? prod.name : "";

      return {
        lookup_key: k,
        found: true,
        price_id: p.id,
        type,
        unit_amount: p.unit_amount,
        currency: p.currency,
        product_id,
        product_name
      };
    });

    const stripe_mode = stripeKey.startsWith("sk_live") ? "LIVE" : "TEST";
    const stripe_key_prefix = stripeKey.slice(0, 7) + "…";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok:true, stripe_mode, stripe_key_prefix, results })
    };
  }catch(e){
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
