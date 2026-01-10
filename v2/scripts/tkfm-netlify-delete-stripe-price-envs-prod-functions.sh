#!/usr/bin/env bash
set -euo pipefail

CTX="production"
SCOPE="functions"
TMP="/tmp/tkfm_env_keys_plain.txt"

echo "== TKFM: DELETE STRIPE_PRICE_/STRIPE_PRODUCT_ FROM Netlify (prod/functions) =="

netlify env:list --plain --context "$CTX" --scope "$SCOPE" > "$TMP"

keys=()
while IFS= read -r line; do
  line="${line%$'\r'}"
  [ -z "$line" ] && continue
  key=""
  if [[ "$line" == *"="* ]]; then
    key="${line%%=*}"
  else
    key="${line%% *}"
  fi

  if [[ "$key" == STRIPE_PRICE_* || "$key" == STRIPE_PRODUCT_* ]]; then
    keys+=("$key")
  fi

done < "$TMP"

if [ ${#keys[@]} -eq 0 ]; then
  echo "OK: no STRIPE_PRICE_/STRIPE_PRODUCT_ keys found in prod/functions."
  exit 0
fi

echo "Found ${#keys[@]} keys to delete."

removed=0
for k in "${keys[@]}"; do
  echo "DEL: $k"
  # Try scoped delete first (newer CLIs)
  if netlify env:unset "$k" --context "$CTX" --scope "$SCOPE" >/dev/null 2>&1; then
    removed=$((removed+1))
    continue
  fi
  # Fallback: delete the key entirely (all contexts/scopes)
  if netlify env:unset "$k" >/dev/null 2>&1; then
    removed=$((removed+1))
    continue
  fi
  echo "WARN: could not delete $k (check netlify CLI permissions)"
done

echo "OK: removed=$removed"
