import Stripe from "stripe";
import { readJson, writeJson, creditsPath } from "./_tkfm_store_studio.js";

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-tkfm-owner-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json"
};

// lookup_key -> credits
const PLAN_CREDITS = {
  label_studio_starter_monthly: 50,
  label_studio_pro_monthly: 150,
  label_studio_credits_25: 25,
  label_studio_credits_100: 100
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
    const session_id = String(body.session_id || "").trim();
    const planId = String(body.planId || "").trim();

    if(!session_id) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"MISSING_SESSION_ID" }) };

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const customerId = (session && session.customer) ? String(session.customer) : "";
    if(!customerId) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"NO_CUSTOMER_ON_SESSION" }) };

    const awarded = Number(PLAN_CREDITS[planId] || 0);
    if(!awarded){
      return { statusCode: 200, headers, body: JSON.stringify({ ok:true, customerId, awarded: 0 }) };
    }

    const p = creditsPath(customerId);
    const data = readJson(p, { customerId, credits: 0 });
    data.credits = Number(data.credits || 0) + awarded;
    data.updatedAt = new Date().toISOString();
    data.lastAward = { planId, credits: awarded, at: data.updatedAt };
    writeJson(p, data);

    return { statusCode: 200, headers, body: JSON.stringify({ ok:true, customerId, awarded, credits: data.credits }) };
  }catch(e){
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
