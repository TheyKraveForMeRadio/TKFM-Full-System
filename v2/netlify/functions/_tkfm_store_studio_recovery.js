import fs from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
const STUDIO_DIR = path.join(STORE_DIR, "studio");
const FILE = path.join(STUDIO_DIR, "recovery_codes.json");

function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }

function readJson(p, fallback){
  try{ return JSON.parse(fs.readFileSync(p, "utf8")); }catch(e){ return fallback; }
}
function writeJson(p, data){
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

export function readRecovery(){
  return readJson(FILE, { codes: {} });
}
export function writeRecovery(data){
  writeJson(FILE, data);
}

export function makeCode(){
  // human-friendly: 4 groups of 4
  const raw = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).toUpperCase().replace(/[^A-Z0-9]/g,"");
  const s = raw.slice(0,16).padEnd(16,"X");
  return `${s.slice(0,4)}-${s.slice(4,8)}-${s.slice(8,12)}-${s.slice(12,16)}`;
}

export function nowIso(){ return new Date().toISOString(); }
