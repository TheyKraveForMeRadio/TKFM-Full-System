#!/usr/bin/env bash
set -euo pipefail

# TKFM: VERIFY Stripe Rotation Boost prices exist by LOOKUP KEY + match expected amounts.
# IMPORTANT: FAIL messages go to STDERR so piping to grep won't hide errors.
#
# Works best if STRIPE_SECRET_KEY is set in your shell.
# If not set, this script will try to load it from .env (STRIPE_SECRET_KEY=...).
#
# Usage:
#   ./scripts/tkfm-stripe-verify-boost-setup.sh
#
# Output (on success):
#   STRIPE_PRICE_ROTATION_BOOST_7D=price_...
#   STRIPE_PRICE_ROTATION_BOOST_30D=price_...

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

api_get() {
  local path="$1"
  curl -sS "https://api.stripe.com/v1/${path}" -u "${STRIPE_SECRET_KEY}:"
}

get_price_by_lookup() {
  local key="$1"
  api_get "prices?lookup_keys[]=${key}&limit=1"
}

node_pick() {
  local json="$1"
  local expr="$2"
  node - <<'NODE' "$json" "$expr"
const raw = process.argv[2] || '';
const expr = process.argv[3] || '';
let j;
try { j = JSON.parse(raw); } catch(e) { process.stdout.write(''); process.exit(0); }
try {
  // eslint-disable-next-line no-eval
  const out = eval(expr);
  if (typeof out === 'string') process.stdout.write(out);
  else process.stdout.write(JSON.stringify(out));
} catch(e) {
  process.stdout.write('');
}
NODE
}

check_one() {
  local lookup="$1"
  local expect_amount="$2"

  local j id active amount currency type
  j="$(get_price_by_lookup "$lookup")"

  id="$(node_pick "$j" "(j.data && j.data[0] && j.data[0].id) || ''")"
  if [ -z "$id" ]; then
    echo "FAIL: lookup key not found in Stripe: ${lookup}" >&2
    exit 3
  fi

  active="$(node_pick "$j" "String(!!(j.data && j.data[0] && j.data[0].active))")"
  amount="$(node_pick "$j" "String((j.data && j.data[0] && j.data[0].unit_amount) || '')")"
  currency="$(node_pick "$j" "String((j.data && j.data[0] && j.data[0].currency) || '')")"
  type="$(node_pick "$j" "String((j.data && j.data[0] && j.data[0].type) || '')")"

  if [ "$active" != "true" ]; then echo "FAIL: ${lookup} not active" >&2; exit 4; fi
  if [ "$currency" != "usd" ]; then echo "FAIL: ${lookup} currency != usd" >&2; exit 5; fi
  if [ "$type" != "one_time" ]; then echo "FAIL: ${lookup} type != one_time" >&2; exit 6; fi
  if [ "$amount" != "$expect_amount" ]; then echo "FAIL: ${lookup} amount mismatch expected=$expect_amount got=$amount" >&2; exit 7; fi

  printf "%s" "$id"
}

P7="$(check_one rotation_boost_7d 9900)"
P30="$(check_one rotation_boost_30d 29900)"

echo "STRIPE_PRICE_ROTATION_BOOST_7D=${P7}"
echo "STRIPE_PRICE_ROTATION_BOOST_30D=${P30}"
