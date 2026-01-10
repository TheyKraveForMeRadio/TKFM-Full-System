/* TKFM: Patch js/tkfm-radio-tv-featured.js to emit data-featured-id on rendered items.
   Safe to run multiple times.

   Handles:
   - Template HTML: <a ... href="${ANYVAR.url}">  => inject data-featured-id="${ANYVAR.id}"
   - Template HTML: <a ... href='${ANYVAR.url}'>  => inject data-featured-id='${ANYVAR.id}'
   - DOM build: el.href = obj.url  => inject el.setAttribute('data-featured-id', obj.id) on next line
   - DOM build: el.setAttribute('href', obj.url) => inject el.setAttribute('data-featured-id', obj.id)

   Also removes the old "TODO add data-featured-id..." comment that could cause false-positive verifies.

   Usage:
     node scripts/tkfm-patch-radio-tv-featured-loader.cjs .
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';
const file = path.join(ROOT, 'js', 'tkfm-radio-tv-featured.js');

if (!fs.existsSync(file)) {
  console.log('SKIP: ' + file + ' not found');
  process.exit(0);
}

let s = fs.readFileSync(file, 'utf8');

// Remove old TODO hint line(s) that include data-featured-id (false positives)
s = s.replace(/^\s*\/\/\s*TKFM:\s*TODO[^\n]*data-featured-id[^\n]*\n+/mg, '');

function hasRealAttr(text) {
  return /<[^>]+data-featured-id\s*=/.test(text);
}

if (hasRealAttr(s)) {
  fs.writeFileSync(file, s, 'utf8');
  console.log('OK: loader already emits real data-featured-id attribute');
  process.exit(0);
}

let changed = false;

function replaceAll(re, fn) {
  const before = s;
  s = s.replace(re, fn);
  if (s !== before) changed = true;
}

/* 1) Template anchors: double quotes */
replaceAll(
  /<a([^>]*?)\s+href="\$\{([A-Za-z_$][\w$]*)\.(url|link)\}"/g,
  (m, attrs, v, prop) => {
    if (m.includes('data-featured-id')) return m;
    return `<a${attrs} data-featured-id="\${${v}.id}" href="\${${v}.${prop}}"`;
  }
);

/* 2) Template anchors: single quotes */
replaceAll(
  /<a([^>]*?)\s+href='\$\{([A-Za-z_$][\w$]*)\.(url|link)\}'/g,
  (m, attrs, v, prop) => {
    if (m.includes('data-featured-id')) return m;
    return `<a${attrs} data-featured-id='\${${v}.id}' href='\${${v}.${prop}}'`;
  }
);

/* 3) href with fallback expression: ${v.url || v.link} */
replaceAll(
  /<a([^>]*?)\s+href="\$\{([A-Za-z_$][\w$]*)\.(url|link)\s*\|\|\s*\2\.(url|link)\}"/g,
  (m, attrs, v) => {
    if (m.includes('data-featured-id')) return m;
    const hrefExpr = m.match(/\s+href="([^"]+)"/)?.[1] || '';
    return `<a${attrs} data-featured-id="\${${v}.id}" href="${hrefExpr}"`;
  }
);

/* 4) DOM build pattern: el.href = obj.url */
replaceAll(
  /(\n\s*)([A-Za-z_$][\w$]*)\.href\s*=\s*([A-Za-z_$][\w$]*)\.(url|link)\s*;?/g,
  (m, nl, el, obj) => {
    if (m.includes('data-featured-id')) return m;
    return `${nl}${el}.href = ${obj}.url || ${obj}.link;\n${nl}${el}.setAttribute('data-featured-id', ${obj}.id);\n`;
  }
);

/* 5) DOM build: el.setAttribute('href', obj.url) */
replaceAll(
  /(\n\s*)([A-Za-z_$][\w$]*)\.setAttribute\(\s*['"]href['"]\s*,\s*([A-Za-z_$][\w$]*)\.(url|link)\s*\)\s*;?/g,
  (m, nl, el, obj) => {
    return `${nl}${el}.setAttribute('href', ${obj}.url || ${obj}.link);\n${nl}${el}.setAttribute('data-featured-id', ${obj}.id);\n`;
  }
);

if (!changed) {
  // Add a safe comment that does NOT include the exact attribute string to avoid false positives
  const hint = '// TKFM: NOTE tracking requires a data-featured id attribute on featured elements.\n';
  s = hint + s;
  fs.writeFileSync(file, s, 'utf8');
  console.log('WARN: could not patch loader automatically (no matching patterns found)');
  process.exit(0);
}

fs.writeFileSync(file, s, 'utf8');

if (hasRealAttr(s)) console.log('OK: patched loader with real data-featured-id attribute');
else console.log('WARN: patch ran but real attribute still not detected (check markup patterns)');
