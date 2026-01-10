/* TKFM: Smart patcher for js/tkfm-radio-tv-featured.js to emit REAL data-featured-id attribute.
   Goal: make Featured tracking work WITHOUT knowing exact markup.

   It tries:
   A) Template literal patch: inject data-featured-id into <a ... href="${VAR.url}">
   B) DOM build patch: when an element's href/open uses VAR.url, add el.setAttribute('data-featured-id', VAR.id)
   C) If no patch applied, write a report to scripts/featured-id-report.txt to show patterns for manual patching.

   Safe to re-run. Uses .cjs to work with "type":"module".

   Usage:
     node scripts/tkfm-smart-featured-id-fix.cjs .
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';
const file = path.join(ROOT, 'js', 'tkfm-radio-tv-featured.js');
const reportFile = path.join(ROOT, 'scripts', 'featured-id-report.txt');

function read(p){ return fs.readFileSync(p, 'utf8'); }
function write(p, s){ fs.writeFileSync(p, s, 'utf8'); }

function stripOldTodo(s) {
  return s.replace(/^\s*\/\/\s*TKFM:\s*NOTE[^\n]*data-featured[^\n]*\n+/mg, '')
          .replace(/^\s*\/\/\s*TKFM:\s*TODO[^\n]*data-featured[^\n]*\n+/mg, '');
}

function hasRealAttr(s) {
  return /<[^>]+data-featured-id\s*=/.test(s) || /setAttribute\(\s*['"]data-featured-id['"]/.test(s);
}

function topVarsFor(prop, s) {
  const re = new RegExp(String.raw`([A-Za-z_$][\w$]*)\.${prop}\b`, 'g');
  const counts = new Map();
  let m;
  while ((m = re.exec(s))) {
    const v = m[1];
    if (['window','document','location','console','Math','Date','JSON'].includes(v)) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([v])=>v);
}

function applyAll(s, re, fn) {
  const before = s;
  const out = s.replace(re, fn);
  return { out, changed: out !== before };
}

function writeReport(s, reason) {
  const lines = s.split('\n');
  const hits = [];

  function addSection(title, matcher) {
    hits.push(`\n=== ${title} ===`);
    let n = 0;
    lines.forEach((ln, i) => {
      if (matcher(ln)) {
        n++;
        hits.push(String(i+1).padStart(5,' ') + ': ' + ln.slice(0, 240));
      }
    });
    if (!n) hits.push('(none)');
  }

  hits.push('TKFM FEATURED ID PATCH REPORT');
  hits.push('Reason: ' + reason);
  hits.push('File: ' + file);
  hits.push('Date: ' + new Date().toISOString());

  addSection('Lines containing ".url" or ".link"', (ln) => /\.url\b|\.link\b/.test(ln));
  addSection('Lines containing "createElement("', (ln) => /createElement\(/.test(ln));
  addSection('Lines containing "href" assignments', (ln) => /\.href\s*=|setAttribute\(\s*['"]href['"]/.test(ln));
  addSection('Lines containing "window.open" / "location"', (ln) => /window\.open|location\.href|location\.assign|location\.replace/.test(ln));
  addSection('Lines with template "<a" fragments', (ln) => /<a\b/.test(ln) || /href="\$\{/.test(ln) || /href='\$\{/.test(ln));

  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  write(reportFile, hits.join('\n') + '\n');
  console.log('WROTE REPORT:', path.relative(ROOT, reportFile));
}

if (!fs.existsSync(file)) {
  console.log('FAIL: missing ' + path.relative(ROOT, file));
  process.exit(2);
}

let s = stripOldTodo(read(file));

if (hasRealAttr(s)) {
  write(file, s);
  console.log('OK: already has real data-featured-id wiring');
  process.exit(0);
}

let changed = false;

// Choose a likely data object variable name (most frequent .url and also has .id)
const urlVars = topVarsFor('url', s).concat(topVarsFor('link', s));
const idVars = new Set(topVarsFor('id', s));
let dataVar = null;
for (const v of urlVars) {
  if (idVars.has(v)) { dataVar = v; break; }
}
if (!dataVar && urlVars.length) dataVar = urlVars[0];

// A) Template literal: <a ... href="${VAR.url}">
{
  const re = /<a([^>]*?)\s+href="\$\{([A-Za-z_$][\w$]*)\.(url|link)\}"/g;
  const r = applyAll(s, re, (m, attrs, v, prop) => {
    if (m.includes('data-featured-id')) return m;
    return `<a${attrs} data-featured-id="\${${v}.id}" href="\${${v}.${prop}}"`;
  });
  if (r.changed) { s = r.out; changed = true; }
}
{
  const re = /<a([^>]*?)\s+href='\$\{([A-Za-z_$][\w$]*)\.(url|link)\}'/g;
  const r = applyAll(s, re, (m, attrs, v, prop) => {
    if (m.includes('data-featured-id')) return m;
    return `<a${attrs} data-featured-id='\${${v}.id}' href='\${${v}.${prop}}'`;
  });
  if (r.changed) { s = r.out; changed = true; }
}

// B) DOM build: element.href = VAR.url OR setAttribute('href', VAR.url)
if (dataVar) {
  // element.href = dataVar.url;
  const re1 = new RegExp(String.raw`(\n\s*)([A-Za-z_$][\w$]*)\.href\s*=\s*${dataVar}\.(url|link)\s*;?`, 'g');
  const r1 = applyAll(s, re1, (m, nl, el) => {
    return `${nl}${el}.href = ${dataVar}.url || ${dataVar}.link;\n${nl}${el}.setAttribute('data-featured-id', ${dataVar}.id);`;
  });
  if (r1.changed) { s = r1.out; changed = true; }

  // el.setAttribute('href', dataVar.url)
  const re2 = new RegExp(String.raw`(\n\s*)([A-Za-z_$][\w$]*)\.setAttribute\(\s*['"]href['"]\s*,\s*${dataVar}\.(url|link)\s*\)\s*;?`, 'g');
  const r2 = applyAll(s, re2, (m, nl, el) => {
    return `${nl}${el}.setAttribute('href', ${dataVar}.url || ${dataVar}.link);\n${nl}${el}.setAttribute('data-featured-id', ${dataVar}.id);`;
  });
  if (r2.changed) { s = r2.out; changed = true; }

  // window.open(dataVar.url, ...)
  // try to find nearest created element var in the 20 lines above (best-effort)
  // If present, tag that element.
  const lines = s.split('\n');
  let touched = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`window.open(${dataVar}.`) || lines[i].includes(`window.open(${dataVar}.url`) || lines[i].includes(`window.open(${dataVar}.link`)) {
      // look back up to 20 lines for "const X = document.createElement"
      for (let j = i; j >= Math.max(0, i-20); j--) {
        const m = lines[j].match(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*document\.createElement\(/);
        if (m) {
          const el = m[1];
          // add attribute line after createElement if not already present nearby
          const insertLine = `  ${el}.setAttribute('data-featured-id', ${dataVar}.id);`;
          let already = false;
          for (let k = j; k <= Math.min(lines.length-1, j+6); k++) {
            if (lines[k].includes(`data-featured-id`) && lines[k].includes(el)) { already = true; break; }
          }
          if (!already) {
            lines.splice(j+1, 0, insertLine);
            touched = true;
            i++; // shift
          }
          break;
        }
      }
    }
  }
  if (touched) { s = lines.join('\n'); changed = true; }
}

if (!changed) {
  writeReport(s, 'No matching patterns found for auto patch');
  // Add a safe note that does not include the exact attribute string to avoid false positives
  const note = '// TKFM: NOTE Featured tracking requires attaching an id attribute to rendered items.\n';
  s = note + s;
  write(file, s);
  console.log('WARN: could not patch automatically');
  process.exit(0);
}

write(file, s);

// final check
if (hasRealAttr(s)) {
  console.log('OK: patched featured loader for tracking');
} else {
  writeReport(s, 'Patch applied but real wiring still not detected');
  console.log('WARN: patched but could not confirm; check report');
}
