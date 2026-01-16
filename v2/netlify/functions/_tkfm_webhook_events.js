import fs from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
const WH_DIR = path.join(STORE_DIR, "webhooks");

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

export function wasProcessed(scope, eventId){
  const fp = path.join(WH_DIR, `${scope}.json`);
  const data = readJson(fp, { processed: {} });
  return !!(data.processed && data.processed[eventId]);
}

export function markProcessed(scope, eventId){
  const fp = path.join(WH_DIR, `${scope}.json`);
  const data = readJson(fp, { processed: {} });
  data.processed = (data.processed && typeof data.processed === "object") ? data.processed : {};
  data.processed[eventId] = new Date().toISOString();

  const keys = Object.keys(data.processed);
  if(keys.length > 5000){
    const sorted = keys.sort((a,b)=>String(data.processed[a]).localeCompare(String(data.processed[b])));
    for(const k of sorted.slice(0, 1000)){
      delete data.processed[k];
    }
  }

  writeJson(fp, data);
}

export function recordDelivery(scope, info){
  const fp = path.join(WH_DIR, `${scope}_deliveries.json`);
  const data = readJson(fp, { deliveries: [] });
  data.deliveries = Array.isArray(data.deliveries) ? data.deliveries : [];
  data.deliveries.unshift(Object.assign({ at: new Date().toISOString() }, info || {}));
  if(data.deliveries.length > 200){
    data.deliveries = data.deliveries.slice(0, 200);
  }
  writeJson(fp, data);
}

export function readDeliveries(scope){
  const fp = path.join(WH_DIR, `${scope}_deliveries.json`);
  return readJson(fp, { deliveries: [] });
}
