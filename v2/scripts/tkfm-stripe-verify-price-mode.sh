#!/usr/bin/env bash
set -euo pipefail

# TKFM: Verify Stripe price ids exist and match STRIPE_SECRET_KEY mode.
#
# Requires:
#   export STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
#
# Usage:
#   ./scripts/tkfm-stripe-verify-price-mode.sh price_... [price_...]

need(){ echo "FAIL: $1"; exit 2; }
mk(){ mktemp 2>/dev/null || echo "/tmp/tkfm_$RANDOM.json"; }

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  need "STRIPE_SECRET_KEY not set"
fi

MODE="unknown"
if [[ "${STRIPE_SECRET_KEY}" == sk_live_* ]]; then MODE="live"; fi
if [[ "${STRIPE_SECRET_KEY}" == sk_test_* ]]; then MODE="test"; fi
if [ "$MODE" = "unknown" ]; then
  need "Unrecognized STRIPE_SECRET_KEY (expected sk_live_... or sk_test_...)"
fi

if [ "${1:-}" = "" ]; then
  need "Provide at least 1 price id"
fi

json_get () {
  local fp="$1"
  local field="$2"
  node --input-type=module - "$fp" "$field" <<'NODE'
import fs from 'node:fs';
const args = process.argv.slice(2);
const fp = args[0] || '';
const field = args[1] || '';
try{
  const j = JSON.parse(fs.readFileSync(fp,'utf8'));
  if (j?.error?.message) process.stdout.write('__ERROR__:' + String(j.error.message));
  else process.stdout.write(String(j?.[field] ?? ''));
}catch(e){
  process.stdout.write('');
}
NODE
}

for pid in "$@"; do
  if [[ "(pid" == "" ]]; then :; fi
  if [[ "$pid" != price_* ]]; then
    need "Not a price id: $pid"
  fi

  tmp="$(mk)"
  curl -sS "https://api.stripe.com/v1/prices/${pid}" -u "${STRIPE_SECRET_KEY}:" > "$tmp"
  got_id="$(json_get "$tmp" "id")"
  if [[ "$got_id" == __ERROR__:* ]] || [ -z "$got_id" ]; then
    echo "FAIL: could not fetch price $pid"
    cat "$tmp" || true
    rm -f "$tmp" 2>/dev/null || true
    exit 3
  fi
  livemode="$(json_get "$tmp" "livemode")"
  rm -f "$tmp" 2>/dev/null || true

  if [ "$MODE" = "live" ] && [ "$livemode" != "true" ]; then
    need "Mode mismatch: key=live but price=$pid livemode=$livemode"
  fi
  if [ "$MODE" = "test" ] && [ "$livemode" != "false" ]; then
    need "Mode mismatch: key=test but price=$pid livemode=$livemode"
  fi

  echo "OK: $pid (livemode=$livemode)"
done

echo "DONE: all prices match key mode ($MODE)"
