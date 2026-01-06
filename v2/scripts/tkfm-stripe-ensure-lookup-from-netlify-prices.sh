#!/usr/bin/env bash
set -euo pipefail

# TKFM: Ensure Stripe lookup_key exists for all STRIPE_PRICE_* envs (production/functions).
# Reads Netlify env (plain), then for each price id:
# - If lookup_key already set to desired, OK
# - Else try update price lookup_key
# - If update not allowed, create a new price copying attributes + lookup_key
#
# REQUIRES:
#   export STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for test)
#   netlify CLI linked to site

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "FAIL: export STRIPE_SECRET_KEY first"
  exit 2
fi
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

MODE="unknown"
if [[ "$STRIPE_SECRET_KEY" == sk_live_* ]]; then MODE="live"; fi
if [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then MODE="test"; fi

echo "== TKFM STRIPE: ENSURE LOOKUP KEYS FROM NETLIFY PRICE ENVS =="
echo "Stripe mode: $MODE"
echo "Netlify filter: context=production scope=functions"
echo

# helper: parse JSON from stdin using node (no jq needed)
json_get() {
  local expr="$1"
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const v=(${expr});process.stdout.write(v===undefined||v===null?'':String(v));}catch(e){process.stdout.write('');}});"
}

stripe_get_price() {
  local pid="$1"
  curl -sS -u "$STRIPE_SECRET_KEY:" "https://api.stripe.com/v1/prices/$pid"
}

stripe_post_price_update() {
  local pid="$1"
  local lookup="$2"
  curl -sS -u "$STRIPE_SECRET_KEY:" -X POST "https://api.stripe.com/v1/prices/$pid" -d "lookup_key=$lookup"
}

stripe_post_price_create() {
  local product="$1"
  local unit_amount="$2"
  local currency="$3"
  local lookup="$4"
  local interval="${5:-}"
  local interval_count="${6:-1}"

  if [ -n "$interval" ]; then
    curl -sS -u "$STRIPE_SECRET_KEY:" -X POST "https://api.stripe.com/v1/prices" \
      -d "product=$product" \
      -d "unit_amount=$unit_amount" \
      -d "currency=$currency" \
      -d "recurring[interval]=$interval" \
      -d "recurring[interval_count]=$interval_count" \
      -d "lookup_key=$lookup"
  else
    curl -sS -u "$STRIPE_SECRET_KEY:" -X POST "https://api.stripe.com/v1/prices" \
      -d "product=$product" \
      -d "unit_amount=$unit_amount" \
      -d "currency=$currency" \
      -d "lookup_key=$lookup"
  fi
}

created=0
updated=0
skipped=0
failed=0

while IFS= read -r line; do
  case "$line" in
    STRIPE_PRICE_*="price_"*)
      KEY="${line%%=*}"
      PID="${line#*=}"

      SUFFIX="${KEY#STRIPE_PRICE_}"
      LOOKUP="$(printf "%s" "$SUFFIX" | tr '[:upper:]' '[:lower:]')"

      # skip boost envs: you already set lookup keys there
      if [ "$LOOKUP" = "rotation_boost_7d" ] || [ "$LOOKUP" = "rotation_boost_30d" ]; then
        echo "OK: lookup exists $LOOKUP (skip)"
        skipped=$((skipped+1))
        continue
      fi

      # GET existing price
      PJSON="$(stripe_get_price "$PID")"
      EXIST_ID="$(printf "%s" "$PJSON" | json_get "j.id")"
      if [ -z "$EXIST_ID" ]; then
        echo "WARN: cannot fetch $PID (mode mismatch?) key=$KEY lookup=$LOOKUP"
        failed=$((failed+1))
        continue
      fi

      CUR_LOOKUP="$(printf "%s" "$PJSON" | json_get "j.lookup_key")"
      if [ "$CUR_LOOKUP" = "$LOOKUP" ]; then
        echo "OK: $PID lookup_key already $LOOKUP"
        skipped=$((skipped+1))
        continue
      fi

      # Try update lookup_key
      UJSON="$(stripe_post_price_update "$PID" "$LOOKUP")"
      UERR="$(printf "%s" "$UJSON" | json_get "j.error && j.error.message")"
      if [ -z "$UERR" ]; then
        NEW_LOOKUP="$(printf "%s" "$UJSON" | json_get "j.lookup_key")"
        if [ "$NEW_LOOKUP" = "$LOOKUP" ]; then
          echo "SET: $PID lookup_key -> $LOOKUP"
          updated=$((updated+1))
          continue
        fi
      fi

      # If lookup already used by some other price, treat as ok
      if printf "%s" "$UERR" | grep -qi "already uses that lookup key"; then
        echo "OK: lookup already used: $LOOKUP (skip)"
        skipped=$((skipped+1))
        continue
      fi

      # If update not allowed, create new price copying attributes
      PRODUCT="$(printf "%s" "$PJSON" | json_get "j.product")"
      UNIT_AMOUNT="$(printf "%s" "$PJSON" | json_get "j.unit_amount")"
      CURRENCY="$(printf "%s" "$PJSON" | json_get "j.currency")"
      INTERVAL="$(printf "%s" "$PJSON" | json_get "j.recurring && j.recurring.interval")"
      INTERVAL_COUNT="$(printf "%s" "$PJSON" | json_get "j.recurring && j.recurring.interval_count")"
      if [ -z "$INTERVAL_COUNT" ]; then INTERVAL_COUNT="1"; fi

      if [ -z "$PRODUCT" ] || [ -z "$UNIT_AMOUNT" ] || [ -z "$CURRENCY" ]; then
        echo "FAIL: missing attrs for create (pid=$PID lookup=$LOOKUP) err=${UERR:-unknown}"
        failed=$((failed+1))
        continue
      fi

      CJSON="$(stripe_post_price_create "$PRODUCT" "$UNIT_AMOUNT" "$CURRENCY" "$LOOKUP" "$INTERVAL" "$INTERVAL_COUNT")"
      CERR="$(printf "%s" "$CJSON" | json_get "j.error && j.error.message")"
      if [ -n "$CERR" ]; then
        # If lookup was created by a race, treat as ok
        if printf "%s" "$CERR" | grep -qi "already uses that lookup key"; then
          echo "OK: lookup already used after create: $LOOKUP (skip)"
          skipped=$((skipped+1))
          continue
        fi
        echo "FAIL: create price failed (lookup=$LOOKUP) $CERR"
        failed=$((failed+1))
        continue
      fi

      NEWPID="$(printf "%s" "$CJSON" | json_get "j.id")"
      if [ -n "$NEWPID" ]; then
        echo "CREATE: $LOOKUP -> $NEWPID (copied from $PID)"
        created=$((created+1))
      else
        echo "FAIL: create returned no id (lookup=$LOOKUP)"
        failed=$((failed+1))
      fi
      ;;
  esac
done < "$TMP"

echo
echo "DONE: created=$created updated=$updated skipped=$skipped failed=$failed"
echo "NEXT: once failed==0, you can prune STRIPE_PRICE_* env vars to fix Netlify 4KB limit."
