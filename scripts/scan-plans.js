import fs from 'fs';
import path from 'path';

const ROOT = process.argv[2] || 'v2';

function walk(dir) {
  const out = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const p = path.join(dir, it.name);
    if (it.isDirectory()) out.push(...walk(p));
    else if (it.isFile() && it.name.toLowerCase().endsWith('.html')) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const plans = new Set();

for (const fp of files) {
  const raw = fs.readFileSync(fp, 'utf8');
  const re = /data-plan\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(raw))) {
    const val = String(m[1] || '').trim();
    if (val) plans.add(val);
  }
}

const list = Array.from(plans).sort();
console.log('FOUND data-plan IDs (' + list.length + '):');
for (const p of list) console.log(' - ' + p);

console.log('\nSUGGESTED NETLIFY ENV VARS:');
for (const p of list) {
  const env = 'STRIPE_PRICE_' + p.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  console.log(env + '=price_...');
}
