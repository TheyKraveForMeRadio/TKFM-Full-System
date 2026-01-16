function clean(v){
  return String(v||"").trim().replace(/^﻿/, "").replace(/^"+|"+$/g, "");
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

import { readDeliveries } from "./_tkfm_webhook_events.js";

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
    const body = JSON.parse(event.body || "{}");
    const scope = String(body.scope || "sponsor").trim();
    if(!scope) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"MISSING_SCOPE" }) };

    const data = readDeliveries(scope);
    const deliveries = Array.isArray(data.deliveries) ? data.deliveries.slice(0, 50) : [];

    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    const stripe_mode = stripeKey.startsWith("sk_live") ? "LIVE" : "TEST";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok:true, scope, stripe_mode, deliveries })
    };
  }catch(e){
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
