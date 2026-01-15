import Stripe from "stripe";
import { readJson, sponsorCreditsPath, writeJson } from "./_tkfm_store_sponsor.js";
import { wasProcessed, markProcessed, recordDelivery } from "./_tkfm_webhook_events.js";

const headers = { "content-type": "application/json" };

// Map lookup_key -> credits
const PLAN_CREDITS = {
  sponsor_read_5pack: 5,
  sponsor_read_20pack: 20,
  sponsor_read_monthly: 30
};

function json(statusCode, body){
  return { statusCode, headers, body: JSON.stringify(body) };
}

async function award(customerId, lookupKey, eventId){
  const creditsToAdd = Number(PLAN_CREDITS[lookupKey] || 0);
  if(!customerId || !creditsToAdd) return { awarded: 0 };

  const p = sponsorCreditsPath(customerId);
  const data = readJson(p, { customerId, credits: 0 });
  data.credits = Number(data.credits || 0) + creditsToAdd;
  data.updatedAt = new Date().toISOString();
  data.lastAward = { lookupKey, credits: creditsToAdd, eventId, at: data.updatedAt };
  writeJson(p, data);

  return { awarded: creditsToAdd, credits: data.credits };
}

async function resolveLookupKeyFromSession(stripe, sessionId){
  const li = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 5, expand: ["data.price"] });
  const first = (li && li.data && li.data[0]) ? li.data[0] : null;
  const price = first && first.price ? first.price : null;
  return (price && price.lookup_key) ? String(price.lookup_key) : "";
}

async function resolveLookupKeyFromInvoice(stripe, invoiceId){
  const inv = await stripe.invoices.retrieve(invoiceId, { expand: ["lines.data.price"] });
  const line = inv && inv.lines && inv.lines.data && inv.lines.data[0] ? inv.lines.data[0] : null;
  const price = line && line.price ? line.price : null;
  return (price && price.lookup_key) ? String(price.lookup_key) : "";
}

export async function handler(event){
  if(event.httpMethod === "GET"){
    return json(200, { ok:true, endpoint:"stripe-webhook-sponsor", hint:"Stripe sends POST with Stripe-Signature. This GET is for sanity-check only." });
  }

  if(event.httpMethod !== "POST"){
    return json(405, { ok:false, error:"METHOD_NOT_ALLOWED" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if(!webhookSecret) return json(500, { ok:false, error:"MISSING_STRIPE_WEBHOOK_SECRET" });
  if(!stripeKey) return json(500, { ok:false, error:"MISSING_STRIPE_SECRET_KEY" });

  const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"] || "";
  if(!sig) return json(400, { ok:false, error:"MISSING_STRIPE_SIGNATURE" });

  const stripe = new Stripe(stripeKey);

  let stripeEvent;
  try{
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  }catch(e){
    recordDelivery("sponsor", { id:"(unknown)", type:"bad_signature", error: e.message });
    return json(400, { ok:false, error:"BAD_SIGNATURE", detail: e.message });
  }

  const scope = "sponsor";
  if(wasProcessed(scope, stripeEvent.id)){
    recordDelivery(scope, { id: stripeEvent.id, type: stripeEvent.type, deduped:true });
    return json(200, { ok:true, deduped:true });
  }

  try{
    let customerId = "";
    let lookupKey = "";
    let awarded = 0;
    let credits = undefined;

    if(stripeEvent.type === "checkout.session.completed"){
      const session = stripeEvent.data.object;
      customerId = session && session.customer ? String(session.customer) : "";
      lookupKey = await resolveLookupKeyFromSession(stripe, session.id);
      const res = await award(customerId, lookupKey, stripeEvent.id);
      awarded = res.awarded; credits = res.credits;
    }

    if(stripeEvent.type === "invoice.paid"){
      const invoice = stripeEvent.data.object;
      customerId = invoice && invoice.customer ? String(invoice.customer) : "";
      lookupKey = await resolveLookupKeyFromInvoice(stripe, invoice.id);
      const res = await award(customerId, lookupKey, stripeEvent.id);
      awarded = res.awarded; credits = res.credits;
    }

    markProcessed(scope, stripeEvent.id);
    recordDelivery(scope, { id: stripeEvent.id, type: stripeEvent.type, customerId, lookupKey, awarded, credits });

    return json(200, { ok:true, type: stripeEvent.type, customerId, lookupKey, awarded, credits });
  }catch(e){
    recordDelivery(scope, { id: stripeEvent.id, type: stripeEvent.type, error: e.message });
    return json(500, { ok:false, error: e.message, type: stripeEvent.type, id: stripeEvent.id });
  }
}
