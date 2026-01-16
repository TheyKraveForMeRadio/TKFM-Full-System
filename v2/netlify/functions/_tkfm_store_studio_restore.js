import fs from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
const STUDIO_DIR = path.join(STORE_DIR, "studio");
const FILE = path.join(STUDIO_DIR, "restore_links.json");

function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }

function readJson(p, fallback){
  try{ return JSON.parse(fs.readFileSync(p, "utf8")); }catch(e){ return fallback; }
}
function writeJson(p, data){
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

export function readStore(){
  return readJson(FILE, { tokens: {} });
}
export function writeStore(data){
  writeJson(FILE, data);
}

export function nowIso(){ return new Date().toISOString(); }

export function makeToken(){
  return (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/[^a-z0-9]/gi,"");
}
