import fs from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
const STUDIO_DIR = path.join(STORE_DIR, "studio");

function ensureDir(p){
  fs.mkdirSync(p, { recursive: true });
}

function safeJsonParse(s, fallback){
  try{ return JSON.parse(s); }catch(e){ return fallback; }
}

export function readJson(filePath, fallback){
  try{
    const raw = fs.readFileSync(filePath, "utf8");
    return safeJsonParse(raw, fallback);
  }catch(e){
    return fallback;
  }
}

export function writeJson(filePath, data){
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export function creditsPath(customerId){
  return path.join(STUDIO_DIR, "credits", `${customerId}.json`);
}

export function requestsPath(){
  return path.join(STUDIO_DIR, "requests.json");
}

export function nowIso(){
  return new Date().toISOString();
}

export function makeId(prefix="lsr"){
  const r = Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now().toString(36)}_${r.slice(0,10)}`;
}
