/* TKFM: Stripe lookup_key fallback injector (CJS-safe)
   Works even when package.json has "type": "module" because this file is .cjs.

   Usage:
     node scripts/tkfm-wire-stripe-lookup-fallback.cjs netlify/functions/create-checkout-session.js
*/
const fs = require('fs');

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

// Replace common PRICE_MAP[planId] assignment patterns
let replacedAny = false;

const patterns = [
  [/const\s+priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g, "const priceId = await tkfmResolvePriceId(planId);\n"],
  [/let\s+priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g,   "let priceId = await tkfmResolvePriceId(planId);\n"],
  [/priceId\s*=\s*PRICE_MAP\s*\[\s*planId\s*\]\s*;\s*/g,         "priceId = await tkfmResolvePriceId(planId);\n"]
];

for (const [re, rep] of patterns) {
  if (re.test(s)) {
    s = s.replace(re, rep);
    replacedAny = true;
  }
}

// Add guard if we can locate resolver usage and guard missing
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

// If not auto-replaced, leave a hint comment
if (!replacedAny) {
  const hint = [
    '',
    '// TKFM: LOOKUP KEY FALLBACK INSTALLED.',
    '// If your handler sets priceId from PRICE_MAP[planId], replace that assignment with:',
    '//   const priceId = await tkfmResolvePriceId(planId);',
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
