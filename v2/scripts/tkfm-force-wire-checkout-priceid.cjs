/* TKFM: Force-wire create-checkout-session.js to resolve priceId via lookup_key fallback.
   CJS-safe even when package.json has "type":"module".

   Usage:
     node scripts/tkfm-force-wire-checkout-priceid.cjs netlify/functions/create-checkout-session.js
*/
const fs = require('fs');

const file = process.argv[2] || 'netlify/functions/create-checkout-session.js';
let s = fs.readFileSync(file, 'utf8');

const MARK = 'TKFM_STRIPE_LOOKUP_FALLBACK';

function ensureResolver(src) {
  if (src.includes(MARK)) return src;

  const resolver = [
    '',
    `// ${MARK}`,
    'async function tkfmResolvePriceId(planId) {',
    "  const id = (planId || '').trim();",
    '  if (!id) return null;',
    '',
    '  // Prefer explicit env mapping first',
    "  const mapped = (typeof PRICE_MAP !== 'undefined' && PRICE_MAP && PRICE_MAP[id]) ? String(PRICE_MAP[id]).trim() : '';",
    '  if (mapped) return mapped;',
    '',
    '  // Fallback: resolve by Stripe lookup_key (Price lookup key == planId)',
    '  try {',
    '    const out = await stripe.prices.list({ active: true, lookup_keys: [id], limit: 1 });',
    '    const p = out && out.data && out.data[0] ? out.data[0] : null;',
    '    if (p && p.id) return p.id;',
    '  } catch (e) {',
    '    // ignore; handled by caller',
    '  }',
    '  return null;',
    '}',
    ''
  ].join('\n');

  // Insert after Stripe init
  const reStripeInit = /(const\s+stripe\s*=\s*new\s+Stripe\([^;]*\);\s*\r?\n)/m;
  if (reStripeInit.test(src)) return src.replace(reStripeInit, `$1${resolver}\n`);

  // Insert after Stripe import
  const reStripeImport = /(import\s+Stripe\s+from\s+['"]stripe['"];\s*\r?\n)/m;
  if (reStripeImport.test(src)) return src.replace(reStripeImport, `$1${resolver}\n`);

  return resolver + '\n' + src;
}

function addGuardIfMissing(src) {
  if (/if\s*\(\s*!\s*priceId\s*\)/.test(src)) return src;
  if (!/await\s+tkfmResolvePriceId\(planId\)/.test(src)) return src;

  const guard = [
    '',
    '    if (!priceId) {',
    '      return {',
    '        statusCode: 400,',
    "        headers: { 'Content-Type': 'application/json; charset=utf-8' },",
    "        body: JSON.stringify({ ok: false, error: 'Unknown planId (no env map + no lookup_key price found)' })",
    '      };',
    '    }',
    ''
  ].join('\n');

  // Insert right after the first resolver call line
  return src.replace(/await\s+tkfmResolvePriceId\(planId\)\s*;\s*/m, (m) => m + guard);
}

s = ensureResolver(s);

// Step 1: replace known PRICE_MAP patterns
const patterns = [
  [/const\s+priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g, "const priceId = await tkfmResolvePriceId(planId);\n"],
  [/let\s+priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g,   "let priceId = await tkfmResolvePriceId(planId);\n"],
  [/priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g,         "priceId = await tkfmResolvePriceId(planId);\n"],
];

let replacedAny = false;
for (const [re, rep] of patterns) {
  if (re.test(s)) {
    s = s.replace(re, rep);
    replacedAny = true;
  }
}

// Step 2: if still not wired, try replacing any existing priceId assignment
if (!/await\s+tkfmResolvePriceId\(planId\)/.test(s)) {
  const rePriceDecl = /(\b(const|let)\s+priceId\s*=\s*)([^;]+)(;\s*)/m;
  if (rePriceDecl.test(s)) {
    s = s.replace(rePriceDecl, `$1await tkfmResolvePriceId(planId)$4`);
    replacedAny = true;
  }
}

// Step 3: if still not wired, insert after planId declaration
if (!/await\s+tkfmResolvePriceId\(planId\)/.test(s)) {
  const rePlanDecl = /(\b(const|let)\s+planId\s*=\s*[^;]+;\s*)/m;
  if (rePlanDecl.test(s)) {
    s = s.replace(rePlanDecl, `$1\n  const priceId = await tkfmResolvePriceId(planId);\n`);
    replacedAny = true;
  }
}

// Step 4: if still not wired, add a loud hint
if (!/await\s+tkfmResolvePriceId\(planId\)/.test(s)) {
  const hint = [
    '',
    '// TKFM: LOOKUP KEY FALLBACK INSTALLED, BUT PRICEID NOT AUTO-WIRED.',
    '// Find where you set priceId for Stripe checkout and replace it with:',
    '//   const priceId = await tkfmResolvePriceId(planId);',
    ''
  ].join('\n');

  if (!s.includes('PRICEID NOT AUTO-WIRED')) s = hint + s;
}

s = addGuardIfMissing(s);

fs.writeFileSync(file, s, 'utf8');
console.log('OK: forced priceId wiring (lookup_key fallback) in ' + file);
