import { promises as fs } from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
const FILE = path.join(STORE_DIR, "drops_credits.json");

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
  const amount = parseInt(body.amount || 1, 10) || 1;

  if (!customerId){
    return { statusCode: 400, headers: { 'content-type':'application/json', ...corsHeaders(event) }, body: JSON.stringify({ ok:false, error:"Missing customerId" }) };
  }

  await ensureDir();
  const db = await readJSON(FILE, { customers: {} });
  if (!db.customers) db.customers = {};

  const cur = db.customers[customerId] || { credits: 0, history: [] };
  const now = nowISO();
  cur.credits = Math.max(0, (parseInt(cur.credits || 0, 10) || 0) - Math.max(1, amount));
  cur.updated_at = now;
  cur.history = Array.isArray(cur.history) ? cur.history : [];
  cur.history.unshift({ ts: now, delta: -Math.max(1, amount), planId: "use_credit", session_id: null });

  db.customers[customerId] = cur;
  await writeJSON(FILE, db);

  return { statusCode: 200, headers: { 'content-type':'application/json', ...corsHeaders(event) }, body: JSON.stringify({ ok:true, credits: cur.credits }) };
}
