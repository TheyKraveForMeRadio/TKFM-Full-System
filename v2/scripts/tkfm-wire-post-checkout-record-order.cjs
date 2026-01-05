#!/usr/bin/env node
/**
 * TKFM: Patch js/tkfm-post-checkout-boost.js to record orders server-side (idempotent).
 * Adds a POST to /.netlify/functions/boost-order-record after unlock.
 */
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';
const fp = path.join(root, 'js', 'tkfm-post-checkout-boost.js');

if (!fs.existsSync(fp)) {
  console.log('MISSING: js/tkfm-post-checkout-boost.js');
  process.exit(0);
}

let s = fs.readFileSync(fp, 'utf8');
if (s.includes('/.netlify/functions/boost-order-record')) {
  console.log('ALREADY: tkfm-post-checkout-boost.js records orders');
  process.exit(0);
}

// Insert helper after postJson definition (look for "async function postJson")
const needle = "async function postJson(data) {";
const idx = s.indexOf(needle);
if (idx === -1) {
  console.log('WARN: could not find insertion point; no changes made');
  process.exit(0);
}

const insertAt = s.indexOf("}", idx);
const helper = `\n\n  async function recordOrder(session_id){\n    try{\n      await fetch('/.netlify/functions/boost-order-record', {\n        method:'POST',\n        headers:{ 'content-type':'application/json' },\n        body: JSON.stringify({ session_id })\n      });\n    }catch(e){}\n  }\n`;

s = s.slice(0, insertAt + 1) + helper + s.slice(insertAt + 1);

// After applyUnlock(...) call, add recordOrder(sessionId)
const hook = "const target = applyUnlock(lookup, days, sessionId);";
const hi = s.indexOf(hook);
if (hi !== -1) {
  const after = hi + hook.length;
  s = s.slice(0, after) + "\n\n    // Record server-side order (anti-fake)\n    recordOrder(sessionId);\n" + s.slice(after);
}

fs.writeFileSync(fp, s, 'utf8');
console.log('PATCHED: js/tkfm-post-checkout-boost.js');
