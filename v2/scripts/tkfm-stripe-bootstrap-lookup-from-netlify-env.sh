#!/usr/bin/env bash
set -euo pipefail

CTX="${1:-production}"
SCOPE="${2:-functions}"

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "FAIL: STRIPE_SECRET_KEY not set"
  exit 2
fi
if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

TMP="${TMPDIR:-/tmp}/tkfm_netlify_env_prices.txt"
rm -f "$TMP" 2>/dev/null || true

(netlify env:list --plain --context "$CTX" --scope "$SCOPE" 2>/dev/null || true) | tr -d '\r' > "$TMP" || true
if [ ! -s "$TMP" ]; then
  echo "FAIL: could not read env list. Run: netlify status && netlify link"
  exit 3
fi

echo "== TKFM STRIPE: BOOTSTRAP LOOKUP KEYS FROM NETLIFY ENV =="
echo "Netlify filter: context=$CTX scope=$SCOPE"

created=0
skipped=0
failed=0

while IFS= read -r line; do
  case "$line" in
    STRIPE_PRICE_*=price_*)
      key="${line%%=*}"
      price_id="${line#*=}"

      rem="${key#STRIPE_PRICE_}"
      lookup="$(echo "$rem" | tr '[:upper:]' '[:lower:]')"

      found="$(curl -sS -u "${STRIPE_SECRET_KEY}:" "https://api.stripe.com/v1/prices?lookup_keys[]=${lookup}&limit=1" | tr -d '\r\n')"
      if echo "$found" | grep -q '"data"'; then
        if echo "$found" | grep -q '"id"'; then
          echo "OK: lookup exists $lookup (skip)"
          skipped=$((skipped+1))
          continue
        fi
      fi

      pjson="$(curl -sS -u "${STRIPE_SECRET_KEY}:" "https://api.stripe.com/v1/prices/${price_id}" || true)"
      if echo "$pjson" | grep -q '"error"'; then
        echo "WARN: cannot fetch $price_id (maybe wrong mode). key=$key lookup=$lookup"
        failed=$((failed+1))
        continue
      fi

      product="$(echo "$pjson" | tr -d '\r\n' | sed -n 's/.*"product"[ ]*:[ ]*"\([^"]*\)".*/\1/p' | head -n 1)"
      currency="$(echo "$pjson" | tr -d '\r\n' | sed -n 's/.*"currency"[ ]*:[ ]*"\([^"]*\)".*/\1/p' | head -n 1)"
      unit_amount="$(echo "$pjson" | tr -d '\r\n' | sed -n 's/.*"unit_amount"[ ]*:[ ]*\([0-9][0-9]*\).*/\1/p' | head -n 1)"
      itype="$(echo "$pjson" | tr -d '\r\n' | sed -n 's/.*"type"[ ]*:[ ]*"\([^"]*\)".*/\1/p' | head -n 1)"

      interval="$(echo "$pjson" | tr -d '\r\n' | sed -n 's/.*"recurring"[^{]*{[^}]*"interval"[ ]*:[ ]*"\([^"]*\)".*/\1/p' | head -n 1)"
      interval_count="$(echo "$pjson" | tr -d '\r\n' | sed -n 's/.*"recurring"[^{]*{[^}]*"interval_count"[ ]*:[ ]*\([0-9][0-9]*\).*/\1/p' | head -n 1)"

      if [ -z "$product" ] || [ -z "$currency" ] || [ -z "$unit_amount" ]; then
        echo "WARN: parse failed for $price_id (key=$key)"
        failed=$((failed+1))
        continue
      fi

      echo "CREATE: lookup=$lookup from $price_id"
      if [ "$itype" = "recurring" ] && [ -n "$interval" ]; then
        ic="${interval_count:-1}"
        resp="$(curl -sS -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/prices           -d "currency=$currency"           -d "unit_amount=$unit_amount"           -d "product=$product"           -d "lookup_key=$lookup"           -d "recurring[interval]=$interval"           -d "recurring[interval_count]=$ic" || true)"
      else
        resp="$(curl -sS -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/prices           -d "currency=$currency"           -d "unit_amount=$unit_amount"           -d "product=$product"           -d "lookup_key=$lookup" || true)"
      fi

      if echo "$resp" | grep -q '"error"'; then
        echo "WARN: create failed for lookup=$lookup"
        echo "$resp" | tr -d '\r' | head -c 180
        echo
        failed=$((failed+1))
      else
        nid="$(echo "$resp" | tr -d '\r\n' | sed -n 's/.*"id"[ ]*:[ ]*"\([^"]*\)".*/\1/p' | head -n 1)"
        echo "OK: created $lookup -> $nid"
        created=$((created+1))
      fi
    ;;
  esac
done < "$TMP"

echo
echo "DONE: created=$created skipped=$skipped failed=$failed"
echo "NEXT: once failed==0, you can prune STRIPE_PRICE_* env vars to fix Netlify 4KB limit."
