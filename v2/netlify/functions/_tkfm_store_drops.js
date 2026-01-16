import fs from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
const DROPS_DIR = path.join(STORE_DIR, "drops");

function ensureDir(p){
  fs.mkdirSync(p, { recursive: true });
}

function readJson(p, fallback){
  try{
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  }catch(e){
    return fallback;
  }
}

function writeJson(p, data){
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

export function dropsCreditsPath(customerId){
  return path.join(DROPS_DIR, "credits", `${customerId}.json`);
}

export function readDropsCredits(customerId){
  const p = dropsCreditsPath(customerId);
  return readJson(p, { customerId, credits: 0 });
}

export function writeDropsCredits(customerId, data){
  const p = dropsCreditsPath(customerId);
  writeJson(p, data);
}
