#!/usr/bin/env bash
set -euo pipefail

# TKFM: prune Stripe PRICE/PRODUCT env vars on Netlify to get under AWS Lambda 4KB env cap.
#
# Keeps:
#   STRIPE_SECRET_KEY (never touched)
#   STRIPE_PRODUCT_ROTATION_BOOST
#   STRIPE_PRICE_ROTATION_BOOST_7D
#   STRIPE_PRICE_ROTATION_BOOST_30D
#
# Removes:
#   STRIPE_PRICE_*   (except the two boost vars above)
#   STRIPE_PRODUCT_* (except STRIPE_PRODUCT_ROTATION_BOOST)

KEEP_KEYS=(
  "STRIPE_PRODUCT_ROTATION_BOOST"
  "STRIPE_PRICE_ROTATION_BOOST_7D"
  "STRIPE_PRICE_ROTATION_BOOST_30D"
)

is_keep () {
  local k="$1"
  for kk in "${KEEP_KEYS[@]}"; do
    if [ "$k" = "$kk" ]; then return 0; fi
  done
  return 1
}

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

echo "== TKFM NETLIFY: PRUNE STRIPE PRICE/PRODUCT ENVS =="

TMP="${TMPDIR:-/tmp}/tkfm_netlify_env_keys.txt"
: > "$TMP"

# Prefer functions scope + production context (closest to Lambda)
(netlify env:list --plain --scope functions --context production 2>/dev/null || true) \
  | tr -d '\r' \
  | awk -F= 'NF>=2 && $1 ~ /^[A-Z0-9_]+$/ {print $1}' \
  | sort -u > "$TMP" || true

# Fallback: plain without scope/context (older CLI)
if [ ! -s "$TMP" ]; then
  (netlify env:list --plain 2>/dev/null || true) \
    | tr -d '\r' \
    | awk -F= 'NF>=2 && $1 ~ /^[A-Z0-9_]+$/ {print $1}' \
    | sort -u > "$TMP" || true
fi

if [ ! -s "$TMP" ]; then
  echo "FAIL: couldn't list env keys."
  echo "Run: netlify status && netlify link"
  exit 3
fi

REMOVED=0
while IFS= read -r k; do
  if [[ "$k" == STRIPE_PRICE_* || "$k" == STRIPE_PRODUCT_* ]]; then
    if is_keep "$k"; then
      echo "KEEP: $k"
      continue
    fi

    echo "UNSET: $k"

    # Try the most specific first, then fall back (different netlify-cli versions)
    netlify env:unset "$k" --context production --scope functions --force >/dev/null 2>&1 || \
    netlify env:unset "$k" --context production --force >/dev/null 2>&1 || \
    netlify env:unset "$k" --force >/dev/null 2>&1 || true

    REMOVED=$((REMOVED+1))
  fi
done < "$TMP"

echo "OK: removed=$REMOVED"
echo
echo "NEXT:"
echo "  ./scripts/tkfm-netlify-env-audit-size.sh"
echo "  netlify deploy --prod"
