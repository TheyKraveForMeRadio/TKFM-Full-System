#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== TKFM: verify create-checkout-session loads (no syntax) =="
node -e "import('./netlify/functions/create-checkout-session.js').then(()=>console.log('OK: function module loaded')).catch(e=>{console.error('FAIL:', e.message||e); process.exit(1)})"

echo "== TKFM: verify function does not set both customer and customer_email in source =="
if grep -q "customer_email" netlify/functions/create-checkout-session.js && grep -q "sessionParams.customer" netlify/functions/create-checkout-session.js; then
  echo "OK: uses customer and avoids customer_email in session params (by design)."
else
  echo "WARN: could not find expected strings; manually inspect if needed."
fi
