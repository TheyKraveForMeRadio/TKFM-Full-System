import { promises as fs } from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
const FILE = path.join(STORE_DIR, "drops_credits.json");

const PLAN_CREDITS = {
  ai_drops_starter_monthly: 20,
  ai_drops_pro_monthly: 60,
  ai_drops_studio_monthly: 200,
  drop_pack_10: 10,
  drop_pack_25: 25,
  drop_pack_100: 100,
  radio_imaging_bundle: 40,
  custom_voice_setup: 0,
  custom_voice_hosting_monthly: 0,
};

function corsHeaders(event){
  const origin = (event?.headers?.origin || event?.headers?.Origin) || '*';
  return {
    'access-control-allow-origin': origin || '*',
    'access-control-allow-methods': 'POST,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '86400',
    'vary': 'Origin',
  };
}

async function ensureDir(){
  await fs.mkdir(STORE_DIR, { recursive: true });
}

async function readJSON(f, fallback){
  try { return JSON.parse(await fs.readFile(f, "utf8")); } catch { return fallback; }
}

async function writeJSON(f, obj){
  await fs.writeFile(f, JSON.stringify(obj, null, 2), "utf8");
}

function nowISO(){ return new Date().toISOString(); }

export async function handler(event){
  if (event.httpMethod === "OPTIONS"){
    return { statusCode: 200, headers: corsHeaders(event), body: "" };
  }
  if (event.httpMethod !== "POST"){
    return { statusCode: 405, headers: { 'content-type':'application/json', ...corsHeaders(event) }, body: JSON.stringify({ ok:false, error:"Method not allowed" }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch { body = {}; }

  const customerId = String(body.customerId || "").trim();
  const planId = String(body.planId || "").trim();
  const session_id = String(body.session_id || "").trim();

  if (!customerId || !planId){
    return { statusCode: 400, headers: { 'content-type':'application/json', ...corsHeaders(event) }, body: JSON.stringify({ ok:false, error:"Missing customerId or planId" }) };
  }

  const add = PLAN_CREDITS[planId];
  if (typeof add !== "number"){
    return { statusCode: 400, headers: { 'content-type':'application/json', ...corsHeaders(event) }, body: JSON.stringify({ ok:false, error:"Unknown planId", planId }) };
  }

  await ensureDir();
  const db = await readJSON(FILE, { customers: {} });
  if (!db.customers) db.customers = {};

  const cur = db.customers[customerId] || { credits: 0, history: [] };
  if (!Array.isArray(cur.history)) cur.history = [];

  // De-dupe: if this session+plan already recorded, do nothing
  if (session_id){
    const exists = cur.history.some(h => h && h.session_id === session_id && h.planId === planId);
    if (exists){
      db.customers[customerId] = cur;
      await writeJSON(FILE, db);
      return { statusCode: 200, headers: { 'content-type':'application/json', ...corsHeaders(event) }, body: JSON.stringify({ ok:true, credits: cur.credits, deduped:true }) };
    }
  }

  cur.credits = Math.max(0, (parseInt(cur.credits || 0, 10) || 0) + add);
  cur.updated_at = nowISO();
  cur.history.unshift({ ts: nowISO(), delta: add, planId, session_id: session_id || null });
  cur.history = cur.history.slice(0, 200);

  db.customers[customerId] = cur;
  await writeJSON(FILE, db);

  return { statusCode: 200, headers: { 'content-type':'application/json', ...corsHeaders(event) }, body: JSON.stringify({ ok:true, credits: cur.credits, added:add }) };
}
