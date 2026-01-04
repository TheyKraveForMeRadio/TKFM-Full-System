/* TKFM: Stripe lookup_key fallback injector (FINAL ESM)
   Works with package.json "type":"module"

   What it does:
   - Injects tkfmResolvePriceId(planId) helper into create-checkout-session.js
   - Attempts to replace common PRICE_MAP[planId] assignments with:
       await tkfmResolvePriceId(planId)
   - Leaves a hint comment if your file uses a different pattern

   Usage:
     node scripts/tkfm-wire-stripe-lookup-fallback.js netlify/functions/create-checkout-session.js

   Stripe requirement:
     Set each Stripe Price "Lookup key" = the planId used on-site (data-plan).
     Example: rotation_boost_7d, rotation_boost_30d
*/
import fs from 'node:fs';

const file = process.argv[2] || 'netlify/functions/create-checkout-session.js';
let s = fs.readFileSync(file, 'utf8');

const MARK = 'TKFM_STRIPE_LOOKUP_FALLBACK';
if (s.includes(MARK)) {
  console.log('OK: already present: ' + file);
  process.exit(0);
}

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

function insertResolver(src) {
  // Insert after Stripe init
  const reStripeInit = /(const\s+stripe\s*=\s*new\s+Stripe\([^;]*\);\s*\r?\n)/m;
  if (reStripeInit.test(src)) return src.replace(reStripeInit, `$1${resolver}\n`);

  // Insert after Stripe import
  const reStripeImport = /(import\s+Stripe\s+from\s+['"]stripe['"];\s*\r?\n)/m;
  if (reStripeImport.test(src)) return src.replace(reStripeImport, `$1${resolver}\n`);

  // Fallback: top
  return resolver + '\n' + src;
}

s = insertResolver(s);

// Replace a few common patterns inside handler
let replacedAny = false;

// 1) const priceId = PRICE_MAP[planId];
const pats = [
  [/const\s+priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g, "const priceId = await tkfmResolvePriceId(planId);\n"],
  [/let\s+priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g,   "let priceId = await tkfmResolvePriceId(planId);\n"],
  [/priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g,         "priceId = await tkfmResolvePriceId(planId);\n"],
  // 2) const price = PRICE_MAP[planId];
  [/const\s+price\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g,   "const price = await tkfmResolvePriceId(planId);\n"],
];

for (const [re, rep] of pats) {
  if (re.test(s)) {
    s = s.replace(re, rep);
    replacedAny = true;
  }
}

// Add guard if we see resolver usage and guard missing
if (!/if\s*\(\s*!\s*priceId\s*\)/.test(s) && /await\s+tkfmResolvePriceId\(planId\)/.test(s)) {
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

  s = s.replace(/await\s+tkfmResolvePriceId\(planId\)\s*;\s*/m, (m) => m + guard);
}

// If we didn't auto-replace, leave a BIG hint so you can one-line patch manually
if (!replacedAny) {
  const hint = [
    '',
    '// TKFM: LOOKUP KEY FALLBACK INSTALLED.',
    '// If your handler uses PRICE_MAP[planId] (or similar) to set priceId, replace that assignment with:',
    '//   const priceId = await tkfmResolvePriceId(planId);',
    ''
  ].join('\n');

  // Put hint near PRICE_MAP if present; else at top
  if (s.includes('PRICE_MAP')) {
    s = s.replace(/(PRICE_MAP\s*=\s*\{[\s\S]*?\}\s*;)/m, `$1\n${hint}`);
  } else {
    s = hint + s;
  }
}

fs.writeFileSync(file, s, 'utf8');
console.log('OK: injected lookup_key fallback into ' + file);
