#!/usr/bin/env bash
set -euo pipefail

# TKFM: Set lookup_key on existing prices (best-effort)
# ESM-safe JSON parsing.
#
# NOTE: Some Stripe accounts do NOT allow updating lookup_key on existing Prices.
# In that case, use:
#   ./scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh
#
# Usage:
#   export STRIPE_SECRET_KEY=sk_live_...
#   ./scripts/tkfm-stripe-set-boost-lookup-keys.sh price_7d price_30d
#

PRICE_7D="${1:-}"
PRICE_30D="${2:-}"

need() { echo "FAIL: $1"; exit 2; }
mk(){ mktemp 2>/dev/null || echo "/tmp/tkfm_$RANDOM.json"; }

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  need "STRIPE_SECRET_KEY not set. Example: export STRIPE_SECRET_KEY=sk_live_..."
fi
if [ -z "$PRICE_7D" ] || [ -z "$PRICE_30D" ]; then
  need "Usage: ./scripts/tkfm-stripe-set-boost-lookup-keys.sh price_7d price_30d"
fi

stripe_set_lookup_to_file () {
  local price_id="$1"
  local lookup="$2"
  local out="$3"
  curl -sS -X POST "https://api.stripe.com/v1/prices/${price_id}" \
    -u "${STRIPE_SECRET_KEY}:" \
    -d "lookup_key=${lookup}" > "$out"
}

stripe_get_price_to_file () {
  local price_id="$1"
  local out="$2"
  curl -sS "https://api.stripe.com/v1/prices/${price_id}" \
    -u "${STRIPE_SECRET_KEY}:" > "$out"
}

node_get_field () {
  local fp="$1"
  local field="$2"
  node --input-type=module - "$fp" "$field" <<'NODE'
import fs from 'node:fs';
const fp = process.argv[1] || '';
const field = process.argv[2] || '';
try{
  const s = fs.readFileSync(fp,'utf8');
  const j = JSON.parse(s);
  if (j?.error?.message) process.stdout.write('__ERROR__:' + String(j.error.message));
  else process.stdout.write(String((j && Object.prototype.hasOwnProperty.call(j, field)) ? (j[field] ?? '') : ''));
}catch(e){
  process.stdout.write('');
}
NODE
}

echo "== TKFM STRIPE: SET BOOST LOOKUP KEYS =="

TMPA="$(mk)"
TMPB="$(mk)"
TMPG1="$(mk)"
TMPG2="$(mk)"

echo "SET: rotation_boost_7d -> $PRICE_7D"
stripe_set_lookup_to_file "$PRICE_7D" "rotation_boost_7d" "$TMPA"
E1="$(node_get_field "$TMPA" "id")"
if [[ "$E1" == __ERROR__:* ]]; then
  echo "FAIL: Stripe update error (7d): ${E1#__ERROR__:}"
  cat "$TMPA" || true
  rm -f "$TMPA" "$TMPB" "$TMPG1" "$TMPG2" 2>/dev/null || true
  exit 3
fi

echo "SET: rotation_boost_30d -> $PRICE_30D"
stripe_set_lookup_to_file "$PRICE_30D" "rotation_boost_30d" "$TMPB"
E2="$(node_get_field "$TMPB" "id")"
if [[ "$E2" == __ERROR__:* ]]; then
  echo "FAIL: Stripe update error (30d): ${E2#__ERROR__:}"
  cat "$TMPB" || true
  rm -f "$TMPA" "$TMPB" "$TMPG1" "$TMPG2" 2>/dev/null || true
  exit 4
fi

echo "VERIFY via GET price objects..."
stripe_get_price_to_file "$PRICE_7D" "$TMPG1"
stripe_get_price_to_file "$PRICE_30D" "$TMPG2"

LK7="$(node_get_field "$TMPG1" "lookup_key")"
LK30="$(node_get_field "$TMPG2" "lookup_key")"

rm -f "$TMPA" "$TMPB" "$TMPG1" "$TMPG2" 2>/dev/null || true

if [ "$LK7" != "rotation_boost_7d" ]; then
  echo "FAIL: price $PRICE_7D lookup_key is '${LK7:-none}' (expected rotation_boost_7d)"
  echo "NEXT: run ./scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh"
  exit 7
fi
if [ "$LK30" != "rotation_boost_30d" ]; then
  echo "FAIL: price $PRICE_30D lookup_key is '${LK30:-none}' (expected rotation_boost_30d)"
  echo "NEXT: run ./scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh"
  exit 8
fi

echo "OK: lookup keys set"
