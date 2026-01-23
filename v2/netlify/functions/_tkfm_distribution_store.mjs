import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// v2/netlify/functions -> v2
const ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = process.env.TKFM_DATA_DIR ? path.resolve(process.env.TKFM_DATA_DIR) : path.join(ROOT, ".tkfm");
const FILE = path.join(DATA_DIR, "distribution-requests.json");

function ensureDir(){
  try{ fs.mkdirSync(DATA_DIR, { recursive: true }); }catch(e){}
}

export function uid(){
  return "dist_" + crypto.randomBytes(6).toString("hex");
}

export function nowISO(){
  return new Date().toISOString();
}

function readFileStore(){
  ensureDir();
  try{
    const raw = fs.readFileSync(FILE, "utf-8");
    const json = JSON.parse(raw);
    if(json && Array.isArray(json.items)) return json.items;
  }catch(e){}
  return null;
}

function writeFileStore(items){
  ensureDir();
  const payload = JSON.stringify({ items }, null, 2);
  fs.writeFileSync(FILE, payload, "utf-8");
}

function getMem(){
  if(!globalThis.__TKFM_DISTRIBUTION_STORE){
    globalThis.__TKFM_DISTRIBUTION_STORE = { items: [] };
  }
  return globalThis.__TKFM_DISTRIBUTION_STORE.items;
}

function setMem(items){
  if(!globalThis.__TKFM_DISTRIBUTION_STORE){
    globalThis.__TKFM_DISTRIBUTION_STORE = { items: [] };
  }
  globalThis.__TKFM_DISTRIBUTION_STORE.items = items;
}

export function loadItems(){
  const fileItems = readFileStore();
  if(fileItems) return fileItems;
  return getMem();
}

export function saveItems(items){
  try{
    writeFileStore(items);
    return { backend: "file", file: FILE };
  }catch(e){
    setMem(items);
    return { backend: "memory" };
  }
}

export { ROOT, DATA_DIR, FILE };
