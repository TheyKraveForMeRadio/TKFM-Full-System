#!/usr/bin/env bash
set -euo pipefail

CTX="production"
SCOPE="functions"
OUT="public/tkfm-price-map.json"
TMP="/tmp/tkfm_env_list_plain.txt"

mkdir -p "$(dirname "$OUT")"

echo "== TKFM: EXPORT STRIPE_PRICE_* -> $OUT =="

echo "Fetching Netlify env (plain): context=$CTX scope=$SCOPE"
netlify env:list --plain --context "$CTX" --scope "$SCOPE" > "$TMP"

# Build JSON map: planId -> priceId
# Supports both formats:
# 1) KEY=VALUE
# 2) KEY VALUE

echo "{" > "$OUT"
first=1

while IFS= read -r line; do
  # strip carriage returns
  line="${line%$'\r'}"
  [ -z "$line" ] && continue

  key=""
  val=""

  if [[ "$line" == *"="* ]]; then
    key="${line%%=*}"
    val="${line#*=}"
  else
    key="${line%% *}"
    val="${line#* }"
  fi

  # Only Stripe price/product vars
  if [[ "$key" == STRIPE_PRICE_* ]]; then
    plan="${key#STRIPE_PRICE_}"
    plan="${plan,,}"
    plan="${plan//__/_}"

    # normalize a couple common suffixes
    plan="${plan//_7d/_7d}"
    plan="${plan//_30d/_30d}"

    if [[ "$first" -eq 0 ]]; then echo "," >> "$OUT"; fi
    first=0
    printf '  "%s": "%s"' "$plan" "$val" >> "$OUT"
  fi

done < "$TMP"

echo "" >> "$OUT"
echo "}" >> "$OUT"

echo "WROTE: $OUT"
wc -c "$OUT" | sed 's/^/BYTES: /'
