/* TKFM: Force-wire Featured IDs into js/tkfm-radio-tv-featured.js (DOM builder)
   This is the direct fix for your loader structure:
     - you compute `url` from `it.url`
     - you build a `row` button element
     - you build an anchor `a` and set `a.href = url`

   This patch:
     1) ensures a stable fid exists: it.id || it.featuredId || it._id || it.slug || it.url || url
     2) tags row + anchor: setAttribute('data-featured-id', fid)

   Safe to re-run (idempotent) and does NOT rely on template strings.

   Usage:
     node scripts/tkfm-force-featured-id-wire.cjs .
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';
const FILE = path.join(ROOT, 'js', 'tkfm-radio-tv-featured.js');

if (!fs.existsSync(FILE)) {
  console.log('FAIL: missing ' + path.relative(ROOT, FILE));
  process.exit(2);
}

let s = fs.readFileSync(FILE, 'utf8');

// If already wired via DOM setAttribute, no-op
if (/setAttribute\(\s*['"]data-featured-id['"]/.test(s)) {
  console.log('OK: featured id wiring already present (no-op)');
  process.exit(0);
}

// Remove older misleading TODO/NOTE lines that might exist
s = s.replace(/^\s*\/\/\s*TKFM:\s*(NOTE|TODO)[^\n]*featured[^\n]*\n+/mg, '');

let changed = false;

function addAfter(re, insert) {
  const before = s;
  s = s.replace(re, (m, indent) => m + insert.replace(/\n/g, '\n' + indent));
  if (s !== before) changed = true;
}

// 1) After url definitions that match `const url = ...it...` -> add fid
// Handles variants: const url = inferUrl(it.url);  const url = esc(inferUrl(it.url));
addAfter(
  /(\n[ \t]*)const\s+url\s*=\s*[^;\n]*\bit\b[^;\n]*;\s*/g,
  "\nconst fid = (it && (it.id || it.featuredId || it._id || it.slug || it.url || it.link)) || url || '';\n"
);

// 2) After row creation: const row = document.createElement('button');
addAfter(
  /(\n[ \t]*)const\s+row\s*=\s*document\.createElement\(\s*['"]button['"]\s*\)\s*;\s*/g,
  "\nif (typeof fid !== 'undefined' && fid) row.setAttribute('data-featured-id', String(fid));\n"
);

// 3) After a.href assignment: a.href = url;
addAfter(
  /(\n[ \t]*)a\.href\s*=\s*url\s*;\s*/g,
  "\nif (typeof fid !== 'undefined' && fid) a.setAttribute('data-featured-id', String(fid));\n"
);

// If we didn't find url -> fid insertion, still patch href with inline fid expression
if (!changed) {
  const before2 = s;
  s = s.replace(/(\n[ \t]*)a\.href\s*=\s*url\s*;\s*/g, (m, indent) => {
    const inline = "\nconst fid = (it && (it.id || it.featuredId || it._id || it.slug || it.url || it.link)) || url || '';\n" +
                   "if (fid) a.setAttribute('data-featured-id', String(fid));\n";
    return m + inline.replace(/\n/g, '\n' + indent);
  });
  if (s !== before2) changed = true;
}

if (!changed) {
  console.log('FAIL: could not patch (patterns not found). Open js/tkfm-radio-tv-featured.js and search for "a.href = url" and "createElement(\'button\')"');
  process.exit(3);
}

fs.writeFileSync(FILE, s, 'utf8');
console.log('OK: forced data-featured-id wiring into loader');
