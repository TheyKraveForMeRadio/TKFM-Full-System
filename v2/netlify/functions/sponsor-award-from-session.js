import Stripe from "stripe";
import { readJson, sponsorCreditsPath, writeJson } from "./_tkfm_store_sponsor.js";

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-tkfm-owner-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json"
};

// Map lookup_key -> credits
const PLAN_CREDITS = {
  sponsor_read_5pack: 5,
  sponsor_read_20pack: 20,
  sponsor_read_monthly: 30
};

export async function handler(event){
  if(event.httpMethod === "OPTIONS"){
    return { statusCode: 200, headers, body: "" };
  }
  try{
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if(!stripeKey) return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error:"MISSING_STRIPE_SECRET_KEY" }) };

    const stripe = new Stripe(stripeKey);

    const body = JSON.parse(event.body || "{}");
    const session_id = (body.session_id || "").trim();
    const planId = (body.planId || "").trim();

    if(!session_id) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"MISSING_SESSION_ID" }) };

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const customerId = (session && session.customer) ? String(session.customer) : "";
    if(!customerId) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"NO_CUSTOMER_ON_SESSION" }) };

    // Determine credits: prefer explicit planId param; else try line_items prices lookup_key is not included by default
    const awarded = Number(PLAN_CREDITS[planId] || 0);
    if(!awarded){
      // allow awarding 0 but still return customerId
      return { statusCode: 200, headers, body: JSON.stringify({ ok:true, customerId, awarded: 0 }) };
    }

    const p = sponsorCreditsPath(customerId);
    const data = readJson(p, { customerId, credits: 0 });
    data.credits = Number(data.credits || 0) + awarded;
    writeJson(p, data);

    return { statusCode: 200, headers, body: JSON.stringify({ ok:true, customerId, awarded, credits: data.credits }) };
  }catch(e){
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
