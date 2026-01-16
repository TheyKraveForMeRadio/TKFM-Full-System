import Stripe from "stripe";

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

  try{
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if(!stripeKey){
      return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error:"MISSING_STRIPE_SECRET_KEY" }) };
    }
    const stripe = new Stripe(stripeKey);

    const body = JSON.parse(event.body || "{}");
    const customerId = String(body.customerId || "").trim();
    const return_url = String(body.return_url || "").trim();

    if(!customerId){
      return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"MISSING_CUSTOMER_ID" }) };
    }

    // Default return URL to label studio hub
    const fallbackReturn = "https://tkfmradio.com/label-studio-hub.html";
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || fallbackReturn
    });

    return { statusCode: 200, headers, body: JSON.stringify({ ok:true, url: session.url }) };
  }catch(e){
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
