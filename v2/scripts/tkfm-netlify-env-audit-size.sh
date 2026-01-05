#!/usr/bin/env bash
set -euo pipefail

# TKFM: audit Netlify env var sizes (to avoid AWS Lambda 4KB env cap)
# Requires: netlify CLI with --json support

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

J="$(netlify env:list --json 2>/dev/null || true)"
if [ -z "$J" ]; then
  echo "FAIL: netlify env:list --json returned empty (update netlify-cli)"
  exit 3
fi

node --input-type=module - <<'NODE' <<< "$J"
let txt = '';
process.stdin.setEncoding('utf8');
for await (const c of process.stdin) txt += c;

let arr;
try { arr = JSON.parse(txt); } catch (e) {
  console.error('FAIL: env:list not JSON');
  process.exit(4);
}

const items = Array.isArray(arr) ? arr : (arr?.env || []);
const rows = [];
let total = 0;

for (const it of items) {
  const k = String(it.key || it.name || '');
  const v = String(it.value || '');
  const sz = Buffer.byteLength(k + '=' + v, 'utf8');
  total += sz;
  rows.push({ k, sz });
}

rows.sort((a, b) => b.sz - a.sz);

console.log('TOTAL_BYTES=' + total);
console.log('TOP20:');
for (const r of rows.slice(0, 20)) {
  console.log(String(r.sz).padStart(6, ' ') + '  ' + r.k);
}
NODE
