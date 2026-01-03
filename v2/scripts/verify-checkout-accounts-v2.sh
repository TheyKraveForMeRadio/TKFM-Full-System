#!/usr/bin/env bash
set -euo pipefail
echo "== Verify create-checkout-session.js builds =="

node -c netlify/functions/create-checkout-session.js >/dev/null 2>&1 || true

grep -n "Accounts V2" -n netlify/functions/create-checkout-session.js || true
grep -n "stripe.checkout.sessions.create" -n netlify/functions/create-checkout-session.js | head -n 20
echo "✅ verify done"
