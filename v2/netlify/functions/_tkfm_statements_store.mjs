import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = process.env.TKFM_DATA_DIR ? path.resolve(process.env.TKFM_DATA_DIR) : path.join(ROOT, ".tkfm");
const FILE = path.join(DATA_DIR, "statements.json");

function ensureDir(){ try{ fs.mkdirSync(DATA_DIR,{recursive:true}); }catch(e){} }
export function nowISO(){ return new Date().toISOString(); }
export function uid(prefix="batch"){ return prefix + "_" + crypto.randomBytes(6).toString("hex"); }

function readFile(){
  ensureDir();
  try{
    const raw = fs.readFileSync(FILE,"utf-8");
    const j = JSON.parse(raw);
    if(j && Array.isArray(j.batches)) return j;
  }catch(e){}
  return { batches: [] };
}

function writeFile(j){
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(j,null,2), "utf-8");
}

export function loadStore(){
  const j = readFile();
  globalThis.__TKFM_STATEMENTS_STORE = j;
  return j;
}

export function saveStore(j){
  try{
    writeFile(j);
    globalThis.__TKFM_STATEMENTS_STORE = j;
    return { backend:"file", file: FILE };
  }catch(e){
    globalThis.__TKFM_STATEMENTS_STORE = j;
    return { backend:"memory", err: String(e && (e.message||e)) };
  }
}

export { ROOT, DATA_DIR, FILE };
