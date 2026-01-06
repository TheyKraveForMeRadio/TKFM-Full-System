#!/usr/bin/env bash
set -euo pipefail

# TKFM: Prune STRIPE_PRICE_* and STRIPE_PRODUCT_* env vars from Netlify (production/functions + best-effort).
# This is required to get under the AWS Lambda 4KB env limit so functions deploy (no 404).

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

TMP="${TMPDIR:-/tmp}/tkfm_netlify_env_plain.txt"
(netlify env:list --plain --scope functions --context production 2>/dev/null || true) | tr -d '\r' > "$TMP" || true
if [ ! -s "$TMP" ]; then
  echo "FAIL: could not list netlify env. Run: netlify status && netlify link"
  exit 3
fi

KEEP_RE='^(STRIPE_PRICE_ROTATION_BOOST_7D|STRIPE_PRICE_ROTATION_BOOST_30D|STRIPE_PRODUCT_ROTATION_BOOST|STRIPE_SECRET_KEY)$'

removed=0
while IFS= read -r line; do
  KEY="${line%%=*}"
  if [[ "$KEY" =~ ^STRIPE_PRICE_ ]] || [[ "$KEY" =~ ^STRIPE_PRODUCT_ ]]; then
    if echo "$KEY" | grep -Eq "$KEEP_RE"; then
      echo "KEEP: $KEY"
      continue
    fi
    # safer unset across combinations
    ./scripts/tkfm-netlify-env-unset-safe.sh "$KEY" >/dev/null 2>&1 || true
    echo "UNSET: $KEY"
    removed=$((removed+1))
  fi
done < <(grep -E '^(STRIPE_PRICE_|STRIPE_PRODUCT_)[A-Z0-9_]+=' "$TMP" || true)

echo "OK: removed=$removed"
echo "NEXT: ./scripts/tkfm-netlify-env-audit-size.sh --context production --scope functions"
