#!/usr/bin/env bash
set -euo pipefail

CTX="${1:-production}"
SCOPE="${2:-functions}"

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

KEEP1="STRIPE_PRICE_ROTATION_BOOST_7D"
KEEP2="STRIPE_PRICE_ROTATION_BOOST_30D"
KEEP3="STRIPE_PRODUCT_ROTATION_BOOST"

TMP="${TMPDIR:-/tmp}/tkfm_netlify_env_plain.txt"
rm -f "$TMP" 2>/dev/null || true
(netlify env:list --plain --context "$CTX" --scope "$SCOPE" 2>/dev/null || true) | tr -d '\r' > "$TMP" || true
if [ ! -s "$TMP" ]; then
  echo "FAIL: could not read env list for $CTX/$SCOPE"
  exit 3
fi

echo "== TKFM NETLIFY: EMPTY STRIPE PRICE/PRODUCT ENVS =="
echo "context=$CTX scope=$SCOPE"

emptied=0
kept=0

while IFS= read -r line; do
  k="${line%%=*}"
  case "$k" in
    STRIPE_PRICE_*|STRIPE_PRODUCT_*)
      if [ "$k" = "$KEEP1" ] || [ "$k" = "$KEEP2" ] || [ "$k" = "$KEEP3" ]; then
        echo "KEEP: $k"
        kept=$((kept+1))
        continue
      fi
      echo "EMPTY: $k"
      netlify env:set "$k" "" --context "$CTX" --scope "$SCOPE" >/dev/null || true
      emptied=$((emptied+1))
    ;;
  esac
done < "$TMP"

echo "OK: emptied=$emptied kept=$kept"
echo "NEXT: ./scripts/tkfm-netlify-env-audit-size.sh --context $CTX --scope $SCOPE"
