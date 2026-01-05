#!/usr/bin/env bash
set -euo pipefail

# TKFM: Ensure Boost prices exist WITH lookup_key set at create-time
# FIX: avoid bash $99 -> $9 positional var expansion (unbound variable).
#
# Creates or finds:
#   rotation_boost_7d  (99 USD)  -> STRIPE_PRICE_ROTATION_BOOST_7D
#   rotation_boost_30d (299 USD) -> STRIPE_PRICE_ROTATION_BOOST_30D
#
# Requires:
#   export STRIPE_SECRET_KEY=sk_live_...   (or sk_test_...)
#
# Usage:
#   ./scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh
#

need(){ echo "FAIL: $1"; exit 2; }
mk(){ mktemp 2>/dev/null || echo "/tmp/tkfm_$RANDOM.json"; }

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  need "STRIPE_SECRET_KEY not set. Example: export STRIPE_SECRET_KEY=sk_live_..."
fi

curl_get_to_file () {
  local url="$1"
  local out="$2"
  curl -sS "$url" -u "${STRIPE_SECRET_KEY}:" > "$out"
}

curl_post_to_file () {
  local url="$1"
  local out="$2"
  shift 2
  curl -sS -X POST "$url" -u "${STRIPE_SECRET_KEY}:" "$@" > "$out"
}

node_get_field () {
  local fp="$1"
  local field="$2"
  node --input-type=module - "$fp" "$field" <<'NODE'
import fs from 'node:fs';
const args = process.argv.slice(2);
const fp = args[0] || '';
const field = args[1] || '';
try{
  const s = fs.readFileSync(fp,'utf8');
  const j = JSON.parse(s);
  if (j?.error?.message) {
    process.stdout.write('__ERROR__:' + String(j.error.message));
  } else {
    const val = (j && Object.prototype.hasOwnProperty.call(j, field)) ? j[field] : '';
    process.stdout.write(String(val ?? ''));
  }
}catch(e){
  process.stdout.write('');
}
NODE
}

node_find_product_id () {
  local fp="$1"
  node --input-type=module - "$fp" <<'NODE'
import fs from 'node:fs';
const args = process.argv.slice(2);
const fp = args[0] || '';
let j = {};
try{ j = JSON.parse(fs.readFileSync(fp,'utf8')); }catch(e){}
const data = Array.isArray(j?.data) ? j.data : [];
let found = '';
for (const p of data){
  const md = p?.metadata || {};
  if (md.tkfm_product === 'rotation_boost') { found = p.id; break; }
}
if (!found){
  for (const p of data){
    if (p?.name === 'TKFM Rotation Boost - Radio TV Featured') { found = p.id; break; }
  }
}
process.stdout.write(found || '');
NODE
}

node_find_price_by_lookup_for_product () {
  local fp="$1"
  local lookup="$2"
  node --input-type=module - "$fp" "$lookup" <<'NODE'
import fs from 'node:fs';
const args = process.argv.slice(2);
const fp = args[0] || '';
const lookup = args[1] || '';
let j = {};
try{ j = JSON.parse(fs.readFileSync(fp,'utf8')); }catch(e){}
const data = Array.isArray(j?.data) ? j.data : [];
let found = '';
for (const pr of data){
  if (pr?.lookup_key === lookup) { found = pr.id; break; }
}
process.stdout.write(found || '');
NODE
}

echo "== TKFM STRIPE: ENSURE BOOST PRICES WITH LOOKUP =="

# 1) Find product
TMPP="$(mk)"
curl_get_to_file "https://api.stripe.com/v1/products?limit=100" "$TMPP"

ERRLIST="$(node_get_field "$TMPP" "id")"
if [[ "$ERRLIST" == __ERROR__:* ]]; then
  echo "FAIL: Stripe products list error: ${ERRLIST#__ERROR__:}"
  cat "$TMPP" || true
  rm -f "$TMPP" 2>/dev/null || true
  exit 3
fi

PROD_ID="$(node_find_product_id "$TMPP")"
rm -f "$TMPP" 2>/dev/null || true

if [ -z "$PROD_ID" ]; then
  echo "INFO: product not found, creating..."
  TMPC="$(mk)"
  curl_post_to_file "https://api.stripe.com/v1/products" "$TMPC" \
    -d "name=TKFM Rotation Boost - Radio TV Featured" \
    -d "description=Priority placement on the Radio TV Featured rail. Opens submission immediately after checkout." \
    -d "metadata[tkfm_product]=rotation_boost" \
    -d "metadata[feature_lane]=radio_tv_featured"

  PROD_ID="$(node_get_field "$TMPC" "id")"
  if [[ "$PROD_ID" == __ERROR__:* ]] || [ -z "$PROD_ID" ]; then
    echo "FAIL: product create failed"
    cat "$TMPC" || true
    rm -f "$TMPC" 2>/dev/null || true
    exit 4
  fi

  LIVEMODE="$(node_get_field "$TMPC" "livemode")"
  if [ "$LIVEMODE" = "false" ]; then
    echo "WARN: Stripe livemode=false (TEST key). For LIVE, export sk_live_... and re-run."
  fi

  rm -f "$TMPC" 2>/dev/null || true
fi

echo "OK: product=$PROD_ID"

# 2) List existing prices for product (scan lookup_key)
TMPL="$(mk)"
curl_get_to_file "https://api.stripe.com/v1/prices?product=${PROD_ID}&limit=100&active=true" "$TMPL"
PRICE_7D="$(node_find_price_by_lookup_for_product "$TMPL" "rotation_boost_7d")"
PRICE_30D="$(node_find_price_by_lookup_for_product "$TMPL" "rotation_boost_30d")"

# 3) Create missing prices with lookup_key at create-time
if [ -z "$PRICE_7D" ]; then
  echo "INFO: creating price rotation_boost_7d (99 USD)..."
  TMP7="$(mk)"
  curl_post_to_file "https://api.stripe.com/v1/prices" "$TMP7" \
    -d "product=${PROD_ID}" \
    -d "currency=usd" \
    -d "unit_amount=9900" \
    -d "nickname=BOOST - 7 DAYS" \
    -d "lookup_key=rotation_boost_7d" \
    -d "metadata[duration_days]=7" \
    -d "metadata[tkfm_product]=rotation_boost" \
    -d "metadata[feature_lane]=radio_tv_featured"
  NEW7="$(node_get_field "$TMP7" "id")"
  if [[ "$NEW7" == __ERROR__:* ]] || [ -z "$NEW7" ]; then
    echo "FAIL: price create (7d) failed"
    cat "$TMP7" || true
    rm -f "$TMPL" "$TMP7" 2>/dev/null || true
    exit 5
  fi
  PRICE_7D="$NEW7"
  rm -f "$TMP7" 2>/dev/null || true
else
  echo "OK: found existing rotation_boost_7d price: $PRICE_7D"
fi

if [ -z "$PRICE_30D" ]; then
  echo "INFO: creating price rotation_boost_30d (299 USD)..."
  TMP30="$(mk)"
  curl_post_to_file "https://api.stripe.com/v1/prices" "$TMP30" \
    -d "product=${PROD_ID}" \
    -d "currency=usd" \
    -d "unit_amount=29900" \
    -d "nickname=BOOST - 30 DAYS" \
    -d "lookup_key=rotation_boost_30d" \
    -d "metadata[duration_days]=30" \
    -d "metadata[tkfm_product]=rotation_boost" \
    -d "metadata[feature_lane]=radio_tv_featured"
  NEW30="$(node_get_field "$TMP30" "id")"
  if [[ "$NEW30" == __ERROR__:* ]] || [ -z "$NEW30" ]; then
    echo "FAIL: price create (30d) failed"
    cat "$TMP30" || true
    rm -f "$TMPL" "$TMP30" 2>/dev/null || true
    exit 6
  fi
  PRICE_30D="$NEW30"
  rm -f "$TMP30" 2>/dev/null || true
else
  echo "OK: found existing rotation_boost_30d price: $PRICE_30D"
fi

rm -f "$TMPL" 2>/dev/null || true

echo ""
echo "STRIPE_PRODUCT_ROTATION_BOOST=$PROD_ID"
echo "STRIPE_PRICE_ROTATION_BOOST_7D=$PRICE_7D"
echo "STRIPE_PRICE_ROTATION_BOOST_30D=$PRICE_30D"
echo ""

if command -v netlify >/dev/null 2>&1; then
  echo "== NETLIFY ENV SET (best-effort) =="
  netlify env:set STRIPE_PRODUCT_ROTATION_BOOST "$PROD_ID" >/dev/null || true
  netlify env:set STRIPE_PRICE_ROTATION_BOOST_7D "$PRICE_7D" >/dev/null || true
  netlify env:set STRIPE_PRICE_ROTATION_BOOST_30D "$PRICE_30D" >/dev/null || true
  echo "OK: Netlify env set"
  echo "NEXT: restart netlify dev: netlify dev --port 8888"
else
  echo "WARN: netlify CLI not found; set env manually in Netlify UI."
fi

echo "DONE"
