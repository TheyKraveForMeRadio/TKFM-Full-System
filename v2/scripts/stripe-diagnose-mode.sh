#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== TKFM Stripe Diagnose =="
echo "Shell env STRIPE_SECRET_KEY:"
env | grep -E '^STRIPE_SECRET_KEY=' || echo "  (none)"

echo
echo "Node process.env STRIPE_SECRET_KEY prefix:"
node -e "console.log(((process.env.STRIPE_SECRET_KEY||'').slice(0,12)) || '(none)')"

echo
echo "Netlify contexts (prefix only):"
echo -n "  dev:        "; netlify env:get STRIPE_SECRET_KEY --context dev | cut -c1-12 || true
echo -n "  production: "; netlify env:get STRIPE_SECRET_KEY --context production | cut -c1-12 || true

echo
echo "If netlify dev log says 'STRIPE_SECRET_KEY (defined in process)' delete STRIPE_SECRET_KEY from Windows Environment Variables (User + System), then reopen terminals."
