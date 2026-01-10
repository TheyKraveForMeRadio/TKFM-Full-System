#!/usr/bin/env bash
set -euo pipefail

CTX="${1:-production}"
SCOPE="${2:-functions}"

echo "== TKFM NETLIFY: PRUNE STRIPE ENVS =="
echo "context=$CTX scope=$SCOPE"

TMP="/tmp/tkfm_netlify_env_list_${CTX}_${SCOPE}.txt"

# Ensure linked
netlify status >/dev/null 2>&1 || netlify status || true

# List env for the given filter
if ! netlify env:list --context "$CTX" --scope "$SCOPE" > "$TMP" 2>/dev/null; then
  echo "WARN: env:list filter failed; falling back to plain env:list" >&2
  netlify env:list > "$TMP"
fi

# Extract Stripe price/product keys
KEYS_FILE="/tmp/tkfm_stripe_env_keys_${CTX}_${SCOPE}.txt"
grep -E '^(STRIPE_PRICE_|STRIPE_PRODUCT_)' "$TMP" \
  | cut -d':' -f1 \
  | tr -d '[:space:]' \
  | sort -u \
  > "$KEYS_FILE" || true

if [ ! -s "$KEYS_FILE" ]; then
  echo "OK: no STRIPE_PRICE_/STRIPE_PRODUCT_ keys found for this filter"
  exit 0
fi

REMOVED=0
while IFS= read -r K; do
  [ -z "$K" ] && continue
  echo "UNSET: $K"
  # Try most specific first
  netlify env:unset "$K" --context "$CTX" --scope "$SCOPE" >/dev/null 2>&1 \
    || netlify env:unset "$K" --context "$CTX" >/dev/null 2>&1 \
    || netlify env:unset "$K" >/dev/null 2>&1 \
    || true
  REMOVED=$((REMOVED+1))
done < "$KEYS_FILE"

echo "OK: attempted_unset=$REMOVED"
