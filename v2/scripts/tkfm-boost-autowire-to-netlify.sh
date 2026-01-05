#!/usr/bin/env bash
set -euo pipefail

# TKFM: ONE COMMAND — Stripe lookup keys -> price ids -> set Netlify env (all contexts)
#
# Requirements:
#   - STRIPE_SECRET_KEY set in shell, OR present in .env as STRIPE_SECRET_KEY=...
#   - netlify CLI installed + logged in + site linked
#
# Usage:
#   ./scripts/tkfm-boost-autowire-to-netlify.sh
#
# This script:
#   1) Finds prices by LOOKUP KEY:
#        rotation_boost_7d (must be $99 one_time USD)
#        rotation_boost_30d (must be $299 one_time USD)
#   2) Sets Netlify env:
#        STRIPE_PRICE_ROTATION_BOOST_7D
#        STRIPE_PRICE_ROTATION_BOOST_30D
#   3) Prints next step: restart netlify dev

load_key_from_env() {
  if [ -n "${STRIPE_SECRET_KEY:-}" ]; then return 0; fi
  if [ -f ".env" ]; then
    local line
    line="$(grep -E '^STRIPE_SECRET_KEY=' .env 2>/dev/null | head -n 1 || true)"
    if [ -n "$line" ]; then
      STRIPE_SECRET_KEY="${line#STRIPE_SECRET_KEY=}"
      STRIPE_SECRET_KEY="$(printf "%s" "$STRIPE_SECRET_KEY" | tr -d '\r\n' | xargs || true)"
      export STRIPE_SECRET_KEY
    fi
  fi
}

load_key_from_env

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "FAIL: missing STRIPE_SECRET_KEY (export it OR put STRIPE_SECRET_KEY=... in .env)" >&2
  exit 2
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "FAIL: curl not found" >&2
  exit 3
fi

if ! command -v node >/dev/null 2>&1; then
  echo "FAIL: node not found" >&2
  exit 4
fi

api_get() {
  local path="$1"
  curl -sS "https://api.stripe.com/v1/${path}" -u "${STRIPE_SECRET_KEY}:"
}

pick() {
  # stdin json, arg expression
  local expr="$1"
  node - <<'NODE' "$expr"
const expr = process.argv[2] || '';
let s='';process.stdin.on('data',d=>s+=d);
process.stdin.on('end',()=>{
  let j;
  try{ j=JSON.parse(s);}catch(e){process.stdout.write('');return;}
  try{
    // eslint-disable-next-line no-eval
    const out = eval(expr);
    process.stdout.write(String(out==null?'':out));
  }catch(e){ process.stdout.write(''); }
});
NODE
}

get_price_id_by_lookup() {
  local lookup="$1"
  local expect_amount="$2"
  local json id active amount currency type
  json="$(api_get "prices?lookup_keys[]=${lookup}&limit=1")"
  id="$(printf "%s" "$json" | pick "(j.data&&j.data[0]&&j.data[0].id)||''")"
  if [ -z "$id" ]; then
    echo "FAIL: Stripe lookup key not found: $lookup" >&2
    exit 10
  fi
  active="$(printf "%s" "$json" | pick "String(!!(j.data&&j.data[0]&&j.data[0].active))")"
  amount="$(printf "%s" "$json" | pick "String((j.data&&j.data[0]&&j.data[0].unit_amount)||'')")"
  currency="$(printf "%s" "$json" | pick "String((j.data&&j.data[0]&&j.data[0].currency)||'')")"
  type="$(printf "%s" "$json" | pick "String((j.data&&j.data[0]&&j.data[0].type)||'')")"

  if [ "$active" != "true" ]; then echo "FAIL: $lookup price not active" >&2; exit 11; fi
  if [ "$currency" != "usd" ]; then echo "FAIL: $lookup currency != usd" >&2; exit 12; fi
  if [ "$type" != "one_time" ]; then echo "FAIL: $lookup type != one_time" >&2; exit 13; fi
  if [ "$amount" != "$expect_amount" ]; then echo "FAIL: $lookup amount mismatch expected=$expect_amount got=$amount" >&2; exit 14; fi

  printf "%s" "$id"
}

P7="$(get_price_id_by_lookup rotation_boost_7d 9900)"
P30="$(get_price_id_by_lookup rotation_boost_30d 29900)"

echo "OK: Stripe price ids"
echo "STRIPE_PRICE_ROTATION_BOOST_7D=$P7"
echo "STRIPE_PRICE_ROTATION_BOOST_30D=$P30"
echo

if ! command -v netlify >/dev/null 2>&1; then
  echo "WARN: netlify CLI not found. Set these in Netlify UI env vars:" >&2
  echo "STRIPE_PRICE_ROTATION_BOOST_7D=$P7"
  echo "STRIPE_PRICE_ROTATION_BOOST_30D=$P30"
  exit 0
fi

set_one() {
  local key="$1"
  local val="$2"
  netlify env:set "$key" "$val" >/dev/null 2>&1 || true
  for ctx in production deploy-preview branch-deploy dev; do
    netlify env:set "$key" "$val" --context "$ctx" >/dev/null 2>&1 || true
  done
  for scope in production deploy-preview branch-deploy; do
    netlify env:set "$key" "$val" --scope "$scope" >/dev/null 2>&1 || true
  done
}

set_one STRIPE_PRICE_ROTATION_BOOST_7D "$P7"
set_one STRIPE_PRICE_ROTATION_BOOST_30D "$P30"

echo "OK: Netlify env set (best-effort across contexts)"
echo "NEXT: restart netlify dev so env reloads:"
echo "netlify dev --port 8888"
