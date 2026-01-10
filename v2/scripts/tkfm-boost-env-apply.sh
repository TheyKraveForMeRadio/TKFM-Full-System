#!/usr/bin/env bash
set -euo pipefail

# TKFM: Apply Boost env snapshot to Netlify env (no secrets)
#
# Usage:
#   ./scripts/tkfm-boost-env-apply.sh .tkfm_boost_env_live.txt
#   ./scripts/tkfm-boost-env-apply.sh .tkfm_boost_env_test.txt

FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "FAIL: provide snapshot file path"
  exit 2
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found. Install: npm i -g netlify-cli"
  exit 3
fi

# Read keys safely
get_kv () {
  local k="$1"
  grep -E "^${k}=" "$FILE" | tail -n 1 | cut -d= -f2- | tr -d '\r\n' || true
}

PROD="$(get_kv STRIPE_PRODUCT_ROTATION_BOOST)"
P7="$(get_kv STRIPE_PRICE_ROTATION_BOOST_7D)"
P30="$(get_kv STRIPE_PRICE_ROTATION_BOOST_30D)"

if [ -z "$P7" ] || [ -z "$P30" ]; then
  echo "FAIL: snapshot missing price ids"
  exit 4
fi

# product id optional
if [ -n "$PROD" ]; then
  netlify env:set STRIPE_PRODUCT_ROTATION_BOOST "$PROD" >/dev/null || true
fi
netlify env:set STRIPE_PRICE_ROTATION_BOOST_7D "$P7" >/dev/null
netlify env:set STRIPE_PRICE_ROTATION_BOOST_30D "$P30" >/dev/null

echo "OK: applied Boost env to Netlify"
echo "STRIPE_PRODUCT_ROTATION_BOOST=${PROD}"
echo "STRIPE_PRICE_ROTATION_BOOST_7D=${P7}"
echo "STRIPE_PRICE_ROTATION_BOOST_30D=${P30}"
echo "NEXT: restart netlify dev: netlify dev --port 8888"
