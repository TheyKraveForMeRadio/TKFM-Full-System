#!/usr/bin/env bash
set -euo pipefail

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "FAIL: export STRIPE_SECRET_KEY=sk_live_... first"
  exit 2
fi

MODE="$(./scripts/tkfm-stripe-key-mode.sh | awk -F= '/^livemode=/{print $2}' | head -n 1)"
if [ "$MODE" != "true" ]; then
  echo "FAIL: STRIPE_SECRET_KEY is not live (livemode=$MODE)"
  exit 3
fi

./scripts/tkfm-netlify-set-stripe-secret.sh production functions
./scripts/tkfm-stripe-bootstrap-lookup-from-netlify-env.sh production functions
./scripts/tkfm-netlify-empty-stripe-price-envs.sh production functions
./scripts/tkfm-netlify-env-audit-size.sh --context production --scope functions
netlify deploy --prod
curl -s -o /dev/null -w "create-checkout-session status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/create-checkout-session
curl -s -o /dev/null -w "featured-media-track status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/featured-media-track
echo "DONE"
