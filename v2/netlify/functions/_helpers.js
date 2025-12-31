import fs from 'fs';
import path from 'path';

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

export async function getStore(key) {
  ensureDir();
  const fp = filePathFor(key);
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
}

export async function setStore(key, value) {
  ensureDir();
  const fp = filePathFor(key);
  fs.writeFileSync(fp, JSON.stringify(value ?? [], null, 2), 'utf8');
  return true;
}
