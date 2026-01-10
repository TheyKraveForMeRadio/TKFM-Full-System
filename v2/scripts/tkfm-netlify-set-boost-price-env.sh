#!/usr/bin/env bash
set -euo pipefail

# TKFM: SET Netlify env vars for boost price IDs (all contexts best-effort).
#
# Requires:
#   - netlify login
#   - netlify link (site linked)
#
# Usage:
#   ./scripts/tkfm-netlify-set-boost-price-env.sh price_7d price_30d
#
# Tip: auto-fill from Stripe lookup keys:
#   export STRIPE_SECRET_KEY=sk_live_...
#   OUT="$(./scripts/tkfm-stripe-verify-boost-setup.sh | grep '^STRIPE_PRICE_ROTATION_BOOST_' )"
#   eval "$OUT"
#   ./scripts/tkfm-netlify-set-boost-price-env.sh "$STRIPE_PRICE_ROTATION_BOOST_7D" "$STRIPE_PRICE_ROTATION_BOOST_30D"

P7="${1:-}"
P30="${2:-}"

if [ -z "$P7" ] || [ -z "$P30" ]; then
  echo "FAIL: need both price ids"
  echo "Usage: ./scripts/tkfm-netlify-set-boost-price-env.sh price_7d price_30d"
  exit 2
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 3
fi

set_one() {
  local key="$1"
  local val="$2"
  netlify env:set "$key" "$val" >/dev/null 2>&1 || true
  for ctx in production deploy-preview branch-deploy dev; do
    netlify env:set "$key" "$val" --context "$ctx" >/dev/null 2>&1 || true
  done
  for scope in production deploy-preview branch-deploy; do
    netlify env:set "$key" "$val" --scope "$scope" >/dev/null 2>&1 || true
  done
}

set_one STRIPE_PRICE_ROTATION_BOOST_7D "$P7"
set_one STRIPE_PRICE_ROTATION_BOOST_30D "$P30"

echo "OK: attempted to set Netlify env:"
echo "STRIPE_PRICE_ROTATION_BOOST_7D=$P7"
echo "STRIPE_PRICE_ROTATION_BOOST_30D=$P30"
echo
echo "NEXT: redeploy OR restart netlify dev:"
echo "  netlify dev --port 8888"
