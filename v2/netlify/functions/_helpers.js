import fs from 'fs';
import path from 'path';

// Local dev + Netlify Dev state dir.
// NOTE: Netlify Functions filesystem is ephemeral in production. This is perfect for dev/testing.
// Later, move storage to Supabase for permanent production storage.
const DATA_DIR = path.join(process.cwd(), '.netlify', 'state');

function ensureDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
}

function safeKey(key) {
  return String(key || '')
    .toLowerCase()
    .replace(/[^a-z0-9_\-]/g, '_')
    .slice(0, 80) || 'store';
}

function filePathFor(key) {
  return path.join(DATA_DIR, safeKey(key) + '.json');
}

export async function getStore(key, fallback = null) {
  ensureDir();
  const fp = filePathFor(key);
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

export async function setStore(key, value) {
  ensureDir();
  const fp = filePathFor(key);
  const v = (value === undefined) ? [] : value;
  fs.writeFileSync(fp, JSON.stringify(v, null, 2), 'utf8');
  return true;
}

export function json(statusCode, bodyObj) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(bodyObj) };
}
