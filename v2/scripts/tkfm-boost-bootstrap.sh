#!/usr/bin/env bash
set -euo pipefail

# TKFM: BOOST BOOTSTRAP (create Stripe prices if missing, then set Netlify env)
# FIX: eliminates curl->pipe parsing (prevents "curl: Failed writing body" / broken pipe issues)
#
# Requirements:
#   STRIPE_SECRET_KEY set OR present in .env as STRIPE_SECRET_KEY=...
#
# Usage:
#   ./scripts/tkfm-boost-bootstrap.sh

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

pick() {
  # args: <json> <expr>
  node scripts/tkfm-json-pick.cjs "$1" "$2"
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

api_post() {
  local path="$1"; shift
  curl -sS -X POST "https://api.stripe.com/v1/${path}" -u "${STRIPE_SECRET_KEY}:" "$@"
}

price_json_by_lookup() {
  local lookup="$1"
  api_get "prices?lookup_keys[]=${lookup}&limit=1"
}

price_id_by_lookup() {
  local lookup="$1"
  local j id
  j="$(price_json_by_lookup "$lookup")"
  id="$(pick "$j" "(j.data&&j.data[0]&&j.data[0].id)||''")"
  printf "%s" "$id"
}

check_price() {
  local lookup="$1"
  local expect_amount="$2"
  local j id active amount currency type
  j="$(price_json_by_lookup "$lookup")"
  id="$(pick "$j" "(j.data&&j.data[0]&&j.data[0].id)||''")"
  if [ -z "$id" ]; then
    echo "" # missing
    return 0
  fi
  active="$(pick "$j" "String(!!(j.data&&j.data[0]&&j.data[0].active))")"
  amount="$(pick "$j" "String((j.data&&j.data[0]&&j.data[0].unit_amount)||'')")"
  currency="$(pick "$j" "String((j.data&&j.data[0]&&j.data[0].currency)||'')")"
  type="$(pick "$j" "String((j.data&&j.data[0]&&j.data[0].type)||'')")"

  if [ "$currency" != "usd" ]; then echo "FAIL: ${lookup} currency != usd" >&2; exit 12; fi
  if [ "$type" != "one_time" ]; then echo "FAIL: ${lookup} type != one_time" >&2; exit 13; fi
  if [ "$amount" != "$expect_amount" ]; then echo "FAIL: ${lookup} amount mismatch expected=$expect_amount got=$amount" >&2; exit 14; fi
  if [ "$active" != "true" ]; then echo "WARN: ${lookup} exists but is not active" >&2; fi

  printf "%s" "$id"
}

P7="$(check_price rotation_boost_7d 9900 || true)"
P30="$(check_price rotation_boost_30d 29900 || true)"

if [ -z "$P7" ] || [ -z "$P30" ]; then
  echo "== CREATE: Stripe product + prices (missing lookup_key) =="

  PROD_JSON="$(api_post products \
    --data-urlencode "name=TKFM Rotation Boost - Radio TV Featured" \
    --data-urlencode "description=Priority placement on the Radio TV Featured rail. Opens submission immediately after checkout." \
    --data-urlencode "metadata[feature_lane]=radio_tv_featured" \
    --data-urlencode "metadata[tkfm_product]=rotation_boost")"

  PROD_ID="$(pick "$PROD_JSON" "j.id||''")"
  if [ -z "$PROD_ID" ]; then
    echo "FAIL: product create failed" >&2
    echo "$PROD_JSON" >&2
    exit 20
  fi

  if [ -z "$P7" ]; then
    P7_JSON="$(api_post prices \
      --data-urlencode "product=${PROD_ID}" \
      --data-urlencode "currency=usd" \
      --data-urlencode "unit_amount=9900" \
      --data-urlencode "nickname=BOOST - 7 DAYS" \
      --data-urlencode "lookup_key=rotation_boost_7d" \
      --data-urlencode "metadata[duration_days]=7" \
      --data-urlencode "metadata[tier]=boost_7d" \
      --data-urlencode "metadata[lane]=radio_tv_featured")"
    P7="$(pick "$P7_JSON" "j.id||''")"
    if [ -z "$P7" ]; then
      echo "FAIL: price 7d create failed" >&2
      echo "$P7_JSON" >&2
      exit 21
    fi
  fi

  if [ -z "$P30" ]; then
    P30_JSON="$(api_post prices \
      --data-urlencode "product=${PROD_ID}" \
      --data-urlencode "currency=usd" \
      --data-urlencode "unit_amount=29900" \
      --data-urlencode "nickname=BOOST - 30 DAYS" \
      --data-urlencode "lookup_key=rotation_boost_30d" \
      --data-urlencode "metadata[duration_days]=30" \
      --data-urlencode "metadata[tier]=boost_30d" \
      --data-urlencode "metadata[lane]=radio_tv_featured")"
    P30="$(pick "$P30_JSON" "j.id||''")"
    if [ -z "$P30" ]; then
      echo "FAIL: price 30d create failed" >&2
      echo "$P30_JSON" >&2
      exit 22
    fi
  fi

  # sanity: check again by lookup
  P7="$(check_price rotation_boost_7d 9900)"
  P30="$(check_price rotation_boost_30d 29900)"
fi

echo
echo "STRIPE_PRICE_ROTATION_BOOST_7D=$P7"
echo "STRIPE_PRICE_ROTATION_BOOST_30D=$P30"
echo

if command -v netlify >/dev/null 2>&1; then
  set_one() {
    local key="$1"
    local val="$2"
    netlify env:set "$key" "$val" >/dev/null 2>&1 || true
    for ctx in production deploy-preview branch-deploy dev; do
      netlify env:set "$key" "$val" --context "$ctx" >/dev/null 2>&1 || true
    done
  }
  set_one STRIPE_PRICE_ROTATION_BOOST_7D "$P7"
  set_one STRIPE_PRICE_ROTATION_BOOST_30D "$P30"
  echo "OK: Netlify env set"
  echo "NEXT: restart netlify dev:"
  echo "netlify dev --port 8888"
else
  echo "WARN: netlify CLI not found. Set env manually:"
  echo "STRIPE_PRICE_ROTATION_BOOST_7D=$P7"
  echo "STRIPE_PRICE_ROTATION_BOOST_30D=$P30"
fi
