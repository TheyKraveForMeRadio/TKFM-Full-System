/* TKFM: Patch js/tkfm-radio-tv-featured.js for tracking
   Based on your report:
     - uses `it.url` and sets `a.href = url;`
     - creates `const row = document.createElement('button');`

   This patch adds:
     if (it && it.id) row.setAttribute('data-featured-id', String(it.id));
     if (it && it.id) a.setAttribute('data-featured-id', String(it.id));

   Safe to run multiple times. Works under "type":"module" because .cjs.

   Usage:
     node scripts/tkfm-patch-featured-itid.cjs .
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';
const file = path.join(ROOT, 'js', 'tkfm-radio-tv-featured.js');

if (!fs.existsSync(file)) {
  console.log('FAIL: missing ' + path.relative(ROOT, file));
  process.exit(2);
}

let s = fs.readFileSync(file, 'utf8');

// If already wired, no-op
if (/data-featured-id/.test(s)) {
  console.log('OK: data-featured-id already present (no-op)');
  process.exit(0);
}

let changed = false;

function insertAfter(re, insertion) {
  const before = s;
  s = s.replace(re, (m, indent) => m + insertion.replace(/\n/g, '\n' + indent));
  if (s !== before) changed = true;
}

// 1) After "const row = document.createElement('button');"
insertAfter(
  /(\n[ \t]*)const\s+row\s*=\s*document\.createElement\(\s*['"]button['"]\s*\)\s*;\s*/g,
  "\nif (it && it.id) row.setAttribute('data-featured-id', String(it.id));\n"
);

// 2) After "a.href = url;"
insertAfter(
  /(\n[ \t]*)a\.href\s*=\s*url\s*;\s*/g,
  "\nif (it && it.id) a.setAttribute('data-featured-id', String(it.id));\n"
);

if (!changed) {
  console.log('FAIL: patterns not found. Open scripts/featured-id-report.txt and patch manually.');
  process.exit(3);
}

fs.writeFileSync(file, s, 'utf8');
console.log('OK: patched js/tkfm-radio-tv-featured.js with data-featured-id');
