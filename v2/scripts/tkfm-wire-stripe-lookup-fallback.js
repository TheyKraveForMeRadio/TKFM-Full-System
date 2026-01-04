/* TKFM: Stripe lookup_key fallback injector (V4 ESM)
   Works with package.json "type":"module"

   Usage:
     node scripts/tkfm-wire-stripe-lookup-fallback.js netlify/functions/create-checkout-session.js
*/
import fs from 'node:fs';

const file = process.argv[2] || 'netlify/functions/create-checkout-session.js';
let s = fs.readFileSync(file, 'utf8');

const MARK = 'TKFM_STRIPE_LOOKUP_FALLBACK';
if (s.includes(MARK)) {
  console.log('OK: already present: ' + file);
  process.exit(0);
}

const resolverLines = [
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
];
const resolver = resolverLines.join('\n');

function insertResolver(src) {
  const reStripeInit = /(const\s+stripe\s*=\s*new\s+Stripe\([^;]*\);\s*\r?\n)/m;
  if (reStripeInit.test(src)) return src.replace(reStripeInit, `$1${resolver}\n`);

  const reStripeImport = /(import\s+Stripe\s+from\s+['"]stripe['"];\s*\r?\n)/m;
  if (reStripeImport.test(src)) return src.replace(reStripeImport, `$1${resolver}\n`);

  return resolver + '\n' + src;
}

s = insertResolver(s);

let replaced = false;
const patterns = [
  [/const\s+priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g, "const priceId = await tkfmResolvePriceId(planId);\n"],
  [/let\s+priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g,   "let priceId = await tkfmResolvePriceId(planId);\n"],
  [/priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g,         "priceId = await tkfmResolvePriceId(planId);\n"]
];

for (const [re, rep] of patterns) {
  if (re.test(s)) {
    s = s.replace(re, rep);
    replaced = true;
  }
}

// Add guard if missing and if we can locate resolver usage
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

if (!replaced) {
  const hint = [
    '',
    '// TKFM: If your checkout handler assigns priceId via PRICE_MAP[planId], replace with:',
    '// const priceId = await tkfmResolvePriceId(planId);',
    ''
  ].join('\n');

  if (s.includes('PRICE_MAP')) {
    s = s.replace(/(PRICE_MAP[^\n]*\r?\n)/, `$1${hint}`);
  } else {
    s = hint + s;
  }
}

fs.writeFileSync(file, s, 'utf8');
console.log('OK: injected lookup_key fallback into ' + file);
