import { promises as fs } from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), ".tkfm_store");
const FILES = {
  paid_lane_submissions: path.join(STORE_DIR, "paid_lane_submissions.json"),
};

async function ensureDir() {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

async function readJSON(file, fallback) {
  try {
    const s = await fs.readFile(file, "utf8");
    return JSON.parse(s);
  } catch (e) {
    return fallback;
  }
}

async function writeJSON(file, data) {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function getStore(key, fallback) {
  await ensureDir();
  const file = FILES[key] || path.join(STORE_DIR, `${key}.json`);
  return await readJSON(file, fallback);
}

export async function setStore(key, data) {
  const file = FILES[key] || path.join(STORE_DIR, `${key}.json`);
  await writeJSON(file, data);
}

export function newId(prefix="pl") {
  const rnd = Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now()}_${rnd.slice(0,10)}`;
}

export function nowISO() {
  return new Date().toISOString();
}

export function isOwner(event) {
  const hdr = (name) => event.headers?.[name] || event.headers?.[name.toLowerCase()] || "";
  const q = event.queryStringParameters || {};
  const key = hdr("x-tkfm-owner-key") || q.owner_key || q.key || "";
  const ownerKey = process.env.TKFM_OWNER_KEY || "";
  const cronKey = process.env.INTERNAL_CRON_KEY || "";
  if (ownerKey && key && key === ownerKey) return true;
  if (cronKey && key && key === cronKey) return true;
  return false;
}
