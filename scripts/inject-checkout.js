import fs from 'fs';
import path from 'path';

const root = process.argv[2] || 'v2';
const tag = '  <script type="module" src="/js/tkfm-checkout.js"></script>\n';
const tagRe = /\/js\/tkfm-checkout\.js/;
const hasDataPlan = /data-plan\s*=/i;

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

const files = walk(root);

let changed = 0;
for (const fp of files) {
  const raw = fs.readFileSync(fp, 'utf8');
  if (!hasDataPlan.test(raw)) continue;
  if (tagRe.test(raw)) continue;

  let next = raw;
  if (/<\/body>/i.test(next)) {
    next = next.replace(/<\/body>/i, tag + '</body>');
  } else {
    next = next + '\n' + tag;
  }

  fs.writeFileSync(fp, next, 'utf8');
  changed++;
}

console.log(`Injected checkout script into ${changed} HTML file(s).`);
