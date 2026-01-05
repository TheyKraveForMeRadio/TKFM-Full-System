/* TKFM: FORCE add data-featured-id wiring to the Featured loader.
   Target: js/tkfm-radio-tv-featured.js
   Safe: idempotent (won't double-insert).
   Usage:
     node scripts/tkfm-force-featured-id-wiring.cjs .
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';
const target = path.join(ROOT, 'js', 'tkfm-radio-tv-featured.js');

if (!fs.existsSync(target)) {
  console.error('FAIL: missing ' + target);
  process.exit(2);
}

let s = fs.readFileSync(target, 'utf8');

// If already wired, no-op
if (/data-featured-id/.test(s) || /\.dataset\.featuredId/.test(s)) {
  console.log('OK (no-op): already has featured id wiring');
  process.exit(0);
}

function insertAfter(pattern, insert) {
  const m = s.match(pattern);
  if (!m || m.index == null) return false;
  const idx = m.index + m[0].length;
  s = s.slice(0, idx) + insert + s.slice(idx);
  return true;
}

// 1) Prefer: after creating the clickable row button
let changed = false;
changed = insertAfter(
  /const\s+row\s*=\s*document\.createElement\(\s*['"]button['"]\s*\)\s*;/,
  `\n      // TKFM: tracking wiring (required)\n      try {\n        const fid = String(((typeof it!=='undefined' && it && it.id) || (typeof item!=='undefined' && item && item.id) || ''));\n        if (fid) row.setAttribute('data-featured-id', fid);\n      } catch (e) {}\n`
);

// 2) If no row pattern, try: after wrap div
if (!changed) {
  changed = insertAfter(
    /const\s+wrap\s*=\s*document\.createElement\(\s*['"]div['"]\s*\)\s*;/,
    `\n      // TKFM: tracking wiring fallback\n      try {\n        const fid = String(((typeof it!=='undefined' && it && it.id) || (typeof item!=='undefined' && item && item.id) || ''));\n        if (fid) wrap.setAttribute('data-featured-id', fid);\n      } catch (e) {}\n`
  );
}

// 3) If still not, try: after href assignment (anchor)
if (!changed) {
  changed = insertAfter(
    /\.href\s*=\s*url\s*;/,
    `\n          // TKFM: tracking wiring fallback\n          try {\n            const fid = String(((typeof it!=='undefined' && it && it.id) || (typeof item!=='undefined' && item && item.id) || ''));\n            if (fid) a.setAttribute('data-featured-id', fid);\n          } catch (e) {}\n`
  );
}

if (!changed) {
  console.error('FAIL: could not find a safe insertion point (patterns not found).');
  process.exit(3);
}

// Add a header note (once)
if (!/TKFM:\s*Featured tracking requires data-featured-id/.test(s)) {
  s = `// TKFM: Featured tracking requires data-featured-id on each Featured item element.\n` + s;
}

fs.writeFileSync(target, s, 'utf8');
console.log('OK: patched ' + target);
