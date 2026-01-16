import { promises as fs } from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
const FILE = path.join(STORE_DIR, "drops_credits.json");

function corsHeaders(event){
  const origin = (event?.headers?.origin || event?.headers?.Origin) || '*';
  return {
    'access-control-allow-origin': origin || '*',
    'access-control-allow-methods': 'GET,OPTIONS',
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

export async function handler(event){
  if (event.httpMethod === "OPTIONS"){
    return { statusCode: 200, headers: corsHeaders(event), body: "" };
  }
  if (event.httpMethod !== "GET"){
    return { statusCode: 405, headers: { 'content-type':'application/json', ...corsHeaders(event) }, body: JSON.stringify({ ok:false, error:"Method not allowed" }) };
  }

  const q = event.queryStringParameters || {};
  const customerId = String(q.customerId || q.customer || "").trim();
  if (!customerId){
    return { statusCode: 400, headers: { 'content-type':'application/json', ...corsHeaders(event) }, body: JSON.stringify({ ok:false, error:"Missing customerId" }) };
  }

  await ensureDir();
  const db = await readJSON(FILE, { customers: {} });
  const cur = (db.customers && db.customers[customerId]) ? db.customers[customerId] : { credits: 0 };

  return { statusCode: 200, headers: { 'content-type':'application/json', ...corsHeaders(event) }, body: JSON.stringify({ ok:true, credits: parseInt(cur.credits || 0, 10) || 0 }) };
}
