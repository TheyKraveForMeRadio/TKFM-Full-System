#!/usr/bin/env bash
set -euo pipefail

# TKFM: Create Rotation Boost product + prices via Stripe API (minimal ASCII params)
# Usage: ./scripts/tkfm-stripe-create-boost-prices.sh
# Output: STRIPE_PRICE_ROTATION_BOOST_7D=... STRIPE_PRICE_ROTATION_BOOST_30D=...

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

api() {
  local method="$1"; shift
  local path="$1"; shift
  curl -sS -X "$method" "https://api.stripe.com/v1/$path" -u "${STRIPE_SECRET_KEY}:" "$@"
}

pick() {
  local expr="$1"
  node - <<'NODE' "$expr"
const expr = process.argv[2] || '';
let s='';process.stdin.on('data',d=>s+=d);
process.stdin.on('end',()=>{
  let j;
  try{ j=JSON.parse(s);}catch(e){process.stdout.write('');return;}
  try{ const out = eval(expr); process.stdout.write(String(out==null?'':out)); }catch(e){ process.stdout.write(''); }
});
NODE
}

PROD_JSON="$(api POST products \
  --data-urlencode "name=TKFM Rotation Boost - Radio TV Featured" \
  --data-urlencode "description=Priority placement on the Radio TV Featured rail. Opens submission immediately after checkout." \
  --data-urlencode "metadata[feature_lane]=radio_tv_featured" \
  --data-urlencode "metadata[tkfm_product]=rotation_boost")"
PROD_ID="$(printf "%s" "$PROD_JSON" | pick "j.id||''")"
if [ -z "$PROD_ID" ]; then
  echo "FAIL: product create failed" >&2
  echo "$PROD_JSON" >&2
  exit 3
fi

P7_JSON="$(api POST prices \
  --data-urlencode "product=${PROD_ID}" \
  --data-urlencode "currency=usd" \
  --data-urlencode "unit_amount=9900" \
  --data-urlencode "nickname=BOOST - 7 DAYS" \
  --data-urlencode "lookup_key=rotation_boost_7d" \
  --data-urlencode "metadata[duration_days]=7" \
  --data-urlencode "metadata[tier]=boost_7d" \
  --data-urlencode "metadata[lane]=radio_tv_featured")"
P7_ID="$(printf "%s" "$P7_JSON" | pick "j.id||''")"
if [ -z "$P7_ID" ]; then
  echo "FAIL: price 7d create failed" >&2
  echo "$P7_JSON" >&2
  exit 4
fi

P30_JSON="$(api POST prices \
  --data-urlencode "product=${PROD_ID}" \
  --data-urlencode "currency=usd" \
  --data-urlencode "unit_amount=29900" \
  --data-urlencode "nickname=BOOST - 30 DAYS" \
  --data-urlencode "lookup_key=rotation_boost_30d" \
  --data-urlencode "metadata[duration_days]=30" \
  --data-urlencode "metadata[tier]=boost_30d" \
  --data-urlencode "metadata[lane]=radio_tv_featured")"
P30_ID="$(printf "%s" "$P30_JSON" | pick "j.id||''")"
if [ -z "$P30_ID" ]; then
  echo "FAIL: price 30d create failed" >&2
  echo "$P30_JSON" >&2
  exit 5
fi

echo "STRIPE_PRICE_ROTATION_BOOST_7D=${P7_ID}"
echo "STRIPE_PRICE_ROTATION_BOOST_30D=${P30_ID}"
