#!/usr/bin/env bash
set -euo pipefail

# Fixes: "No such price ... similar object exists in live mode, but a test mode key was used"
#
# What it does:
# - Verifies your currently exported STRIPE_SECRET_KEY is live
# - Sets Netlify production/functions STRIPE_SECRET_KEY to that live key
# - Redeploys prod
# - Verifies functions are not 404
#
# Usage:
#   export STRIPE_SECRET_KEY=sk_live_...
#   ./scripts/tkfm-fix-stripe-mode-mismatch.sh

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "FAIL: STRIPE_SECRET_KEY not set in environment"
  exit 2
fi

MODE="$(./scripts/tkfm-stripe-key-mode.sh | tr -d '\r' | awk -F= '/^livemode=/{print $2}' | head -n 1)"
if [ "$MODE" != "true" ]; then
  echo "FAIL: your exported STRIPE_SECRET_KEY is NOT live (livemode=$MODE)."
  echo "Export your LIVE key first:"
  echo "  export STRIPE_SECRET_KEY=sk_live_..."
  exit 3
fi

./scripts/tkfm-netlify-set-stripe-secret.sh production functions

echo "== DEPLOY PROD =="
netlify deploy --prod

echo "== VERIFY FUNCTIONS NOT 404 =="
curl -s -o /dev/null -w "create-checkout-session status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/create-checkout-session
curl -s -o /dev/null -w "featured-media-track status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/featured-media-track

echo "DONE"
