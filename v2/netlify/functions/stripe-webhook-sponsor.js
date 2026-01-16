import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { readJson, sponsorCreditsPath, writeJson } from "./_tkfm_store_sponsor.js";

const headers = { "content-type": "application/json" };
const PLAN_CREDITS = { sponsor_read_5pack:5, sponsor_read_20pack:20, sponsor_read_monthly:30 };

const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
const WH_DIR = path.join(STORE_DIR, "webhooks");

function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function readFileJson(p, fallback){ try{ return JSON.parse(fs.readFileSync(p, "utf8")); }catch(e){ return fallback; } }
function writeFileJson(p, data){ ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8"); }

function recordDelivery(scope, info){
  const fp = path.join(WH_DIR, `${scope}_deliveries.json`);
  const data = readFileJson(fp, { deliveries: [] });
  data.deliveries = Array.isArray(data.deliveries) ? data.deliveries : [];
  data.deliveries.unshift(Object.assign({ at: new Date().toISOString() }, info || {}));
  if(data.deliveries.length > 200) data.deliveries = data.deliveries.slice(0, 200);
  writeFileJson(fp, data);
}

function wasProcessed(scope, eventId){
  const fp = path.join(WH_DIR, `${scope}.json`);
  const data = readFileJson(fp, { processed: {} });
  return !!(data.processed && data.processed[eventId]);
}
function markProcessed(scope, eventId){
  const fp = path.join(WH_DIR, `${scope}.json`);
  const data = readFileJson(fp, { processed: {} });
  data.processed = (data.processed && typeof data.processed === "object") ? data.processed : {};
  data.processed[eventId] = new Date().toISOString();
  writeFileJson(fp, data);
}

function json(statusCode, body){ return { statusCode, headers, body: JSON.stringify(body) }; }

function getRawBody(event){
  if(event && event.isBase64Encoded) return Buffer.from(event.body||"", "base64").toString("utf8");
  if(typeof event.body === "string") return event.body;
  return JSON.stringify(event.body || {});
}

function isLocalHost(event){
  const host = String(event.headers?.host || event.headers?.Host || "");
  return host.includes("localhost") || host.includes("127.0.0.1");
}

function insecureFlagEnabled(){
  return String(process.env.TKFM_WEBHOOK_INSECURE_LOCAL || "").trim() === "1";
}

function allowInsecureLocal(event){
  // LOCAL-ONLY bypass (never allowed on production domains).
  const flag = insecureFlagEnabled();
  if(!flag) return false;
  const local = isLocalHost(event);
  if(!local) return "MISCONFIG"; // fail hard if someone sets flag in production
  return true;
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

function pickCustomerId(obj){
  return String(
    (obj && obj.customer) ||
    (obj && obj.customer_id) ||
    (obj && obj.customer_details && obj.customer_details.customer) ||
    ""
  ).trim();
}


function award(customerId, lookupKey, eventId){
  const add = Number(PLAN_CREDITS[lookupKey] || 0);
  if(!customerId || !add) return { awarded: 0 };
  const p = sponsorCreditsPath(customerId);
  const data = readJson(p, { customerId, credits: 0 });
  data.credits = Number(data.credits || 0) + add;
  data.updatedAt = new Date().toISOString();
  data.lastAward = { lookupKey, credits: add, eventId, at: data.updatedAt };
  writeJson(p, data);
  return { awarded: add, credits: data.credits };
}


export async function handler(event){
  if(event.httpMethod === "GET"){
    return json(200, { ok:true, endpoint:"stripe-webhook-sponsor", hint:"POST from Stripe. GET is sanity-check only." });
  }
  if(event.httpMethod !== "POST") return json(405, { ok:false, error:"METHOD_NOT_ALLOWED" });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if(!stripeKey) return json(500, { ok:false, error:"MISSING_STRIPE_SECRET_KEY" });
  const stripe = new Stripe(stripeKey);

  const rawBody = getRawBody(event);

  const insecure = allowInsecureLocal(event);
  if(insecure === "MISCONFIG"){
    return json(500, { ok:false, error:"MISCONFIG_INSECURE_FLAG_IN_PROD", hint:"Unset TKFM_WEBHOOK_INSECURE_LOCAL in production env." });
  }

  let stripeEvent;
  if(insecure === true){
    try{ stripeEvent = JSON.parse(rawBody); }catch(e){ return json(400, { ok:false, error:"BAD_JSON" }); }
  } else {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if(!webhookSecret) return json(500, { ok:false, error:"MISSING_STRIPE_WEBHOOK_SECRET" });
    const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"] || "";
    if(!sig) return json(400, { ok:false, error:"MISSING_STRIPE_SIGNATURE" });
    try{ stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret); }
    catch(e){ recordDelivery("sponsor", { id:"(unknown)", type:"bad_signature", error:e.message, insecure:false }); return json(400, { ok:false, error:"BAD_SIGNATURE" }); }
  }

  const scope = "sponsor";
  if(stripeEvent && stripeEvent.id && wasProcessed(scope, stripeEvent.id)){
    recordDelivery(scope, { id: stripeEvent.id, type: stripeEvent.type, deduped:true, insecure: !!insecure });
    return json(200, { ok:true, deduped:true });
  }

  try{
    const type = String(stripeEvent.type || "");
    const obj = stripeEvent && stripeEvent.data ? stripeEvent.data.object : null;

    let customerId = pickCustomerId(obj);
    let lookupKey = "";
    let awarded = 0;
    let credits;

    if(type === "checkout.session.completed"){
      lookupKey = await resolveLookupKeyFromSession(stripe, obj.id);
      const res = award(customerId, lookupKey, stripeEvent.id || "(noid)");
      awarded = res.awarded; credits = res.credits;
    }

    if(type === "invoice.paid" || type === "invoice_payment.paid" || type === "invoice.payment_succeeded"){
      lookupKey = await resolveLookupKeyFromInvoice(stripe, obj.id);
      const res = award(customerId, lookupKey, stripeEvent.id || "(noid)");
      awarded = res.awarded; credits = res.credits;
    }

    if(stripeEvent && stripeEvent.id) markProcessed(scope, stripeEvent.id);
    recordDelivery(scope, { id: stripeEvent.id || "(noid)", type, customerId, lookupKey, awarded, credits, insecure: !!insecure });

    return json(200, { ok:true, type, customerId, lookupKey, awarded, credits, insecure: !!insecure });
  }catch(e){
    recordDelivery(scope, { id: stripeEvent.id || "(noid)", type: stripeEvent.type, error: e.message, insecure: !!insecure });
    return json(500, { ok:false, error: e.message });
  }
}
