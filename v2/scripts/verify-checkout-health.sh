#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== Verify checkout health =="

echo "1) Confirm create-checkout-session has only one planId declaration:"
grep -n "const planId" netlify/functions/create-checkout-session.js || true

echo
echo "2) Find hard-coded price_ ids in pages (optional):"
./scripts/find-price-ids-in-pages.sh || true

echo
echo "3) If server is running:"
echo "curl -s http://localhost:8888/.netlify/functions/create-checkout-session -X POST -H 'content-type: application/json' -d '{"planId":"video_monthly_visuals"}' | head"
