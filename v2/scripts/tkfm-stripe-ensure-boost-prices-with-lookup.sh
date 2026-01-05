#!/usr/bin/env bash
set -euo pipefail

# TKFM: Ensure Boost prices exist WITH lookup_key set at create-time
# Fixes:
# - ESM-safe node parsing under type=module
# - Avoid "$99" -> unbound $9 expansion
# - Reuse existing lookup_key prices (no duplicate create fail)
# - Reliable Netlify env:set (auto siteId; avoids missing account_id)

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
  const j = JSON.parse(fs.readFileSync(fp,'utf8'));
  if (j?.error?.message) process.stdout.write('__ERROR__:' + String(j.error.message));
  else process.stdout.write(String(j?.[field] ?? ''));
}catch(e){
  process.stdout.write('');
}
NODE
}

node_get_error_message () {
  local fp="$1"
  node --input-type=module - "$fp" <<'NODE'
import fs from 'node:fs';
const fp = process.argv.slice(2)[0] || '';
try{
  const j = JSON.parse(fs.readFileSync(fp,'utf8'));
  process.stdout.write(String(j?.error?.message ?? ''));
}catch(e){
  process.stdout.write('');
}
NODE
}

node_get_first_price_id () {
  local fp="$1"
  node --input-type=module - "$fp" <<'NODE'
import fs from 'node:fs';
const fp = process.argv.slice(2)[0] || '';
try{
  const j = JSON.parse(fs.readFileSync(fp,'utf8'));
  process.stdout.write(String(j?.data?.[0]?.id || ''));
}catch(e){
  process.stdout.write('');
}
NODE
}

node_find_product_id () {
  local fp="$1"
  node --input-type=module - "$fp" <<'NODE'
import fs from 'node:fs';
const fp = process.argv.slice(2)[0] || '';
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

resolve_lookup_price_id () {
  local lookup="$1"
  local tmp
  tmp="$(mk)"
  curl_get_to_file "https://api.stripe.com/v1/prices?lookup_keys[]=${lookup}&limit=1" "$tmp"
  local id
  id="$(node_get_first_price_id "$tmp")"
  rm -f "$tmp" 2>/dev/null || true
  printf "%s" "$id"
}

echo "== TKFM STRIPE: ENSURE BOOST PRICES WITH LOOKUP =="

TMPP="$(mk)"
curl_get_to_file "https://api.stripe.com/v1/products?limit=100" "$TMPP"
PROD_ID="$(node_find_product_id "$TMPP")"
rm -f "$TMPP" 2>/dev/null || true

if [ -z "$PROD_ID" ]; then
  echo "INFO: product not found, creating..."
  TMPC="$(mk)"
  curl_post_to_file "https://api.stripe.com/v1/products" "$TMPC"     -d "name=TKFM Rotation Boost - Radio TV Featured"     -d "description=Priority placement on the Radio TV Featured rail. Opens submission immediately after checkout."     -d "metadata[tkfm_product]=rotation_boost"     -d "metadata[feature_lane]=radio_tv_featured"

  PROD_ID="$(node_get_field "$TMPC" "id")"
  if [[ "$PROD_ID" == __ERROR__:* ]] || [ -z "$PROD_ID" ]; then
    echo "FAIL: product create failed"
    cat "$TMPC" || true
    rm -f "$TMPC" 2>/dev/null || true
    exit 4
  fi
  rm -f "$TMPC" 2>/dev/null || true
fi

echo "OK: product=$PROD_ID"

PRICE_7D="$(resolve_lookup_price_id rotation_boost_7d)"
PRICE_30D="$(resolve_lookup_price_id rotation_boost_30d)"

if [ -n "$PRICE_7D" ]; then echo "OK: found existing lookup rotation_boost_7d -> $PRICE_7D"; fi
if [ -n "$PRICE_30D" ]; then echo "OK: found existing lookup rotation_boost_30d -> $PRICE_30D"; fi

if [ -z "$PRICE_7D" ]; then
  echo "INFO: creating price rotation_boost_7d (99 USD)..."
  TMP7="$(mk)"
  curl_post_to_file "https://api.stripe.com/v1/prices" "$TMP7"     -d "product=${PROD_ID}" -d "currency=usd" -d "unit_amount=9900"     -d "nickname=BOOST - 7 DAYS" -d "lookup_key=rotation_boost_7d"     -d "metadata[duration_days]=7" -d "metadata[tkfm_product]=rotation_boost" -d "metadata[feature_lane]=radio_tv_featured"

  NEW7="$(node_get_field "$TMP7" "id")"
  if [ -z "$NEW7" ]; then
    MSG="$(node_get_error_message "$TMP7")"
    if echo "$MSG" | grep -qi "already uses that lookup key"; then
      RESOLVED="$(resolve_lookup_price_id rotation_boost_7d)"
      [ -n "$RESOLVED" ] || { echo "FAIL: lookup exists but cannot resolve"; cat "$TMP7" || true; exit 5; }
      echo "OK: lookup already existed, using $RESOLVED"
      PRICE_7D="$RESOLVED"
    else
      echo "FAIL: price create (7d) failed"
      cat "$TMP7" || true
      exit 5
    fi
  else
    PRICE_7D="$NEW7"
  fi
  rm -f "$TMP7" 2>/dev/null || true
fi

if [ -z "$PRICE_30D" ]; then
  echo "INFO: creating price rotation_boost_30d (299 USD)..."
  TMP30="$(mk)"
  curl_post_to_file "https://api.stripe.com/v1/prices" "$TMP30"     -d "product=${PROD_ID}" -d "currency=usd" -d "unit_amount=29900"     -d "nickname=BOOST - 30 DAYS" -d "lookup_key=rotation_boost_30d"     -d "metadata[duration_days]=30" -d "metadata[tkfm_product]=rotation_boost" -d "metadata[feature_lane]=radio_tv_featured"

  NEW30="$(node_get_field "$TMP30" "id")"
  if [ -z "$NEW30" ]; then
    MSG="$(node_get_error_message "$TMP30")"
    if echo "$MSG" | grep -qi "already uses that lookup key"; then
      RESOLVED="$(resolve_lookup_price_id rotation_boost_30d)"
      [ -n "$RESOLVED" ] || { echo "FAIL: lookup exists but cannot resolve"; cat "$TMP30" || true; exit 6; }
      echo "OK: lookup already existed, using $RESOLVED"
      PRICE_30D="$RESOLVED"
    else
      echo "FAIL: price create (30d) failed"
      cat "$TMP30" || true
      exit 6
    fi
  else
    PRICE_30D="$NEW30"
  fi
  rm -f "$TMP30" 2>/dev/null || true
fi

echo ""
echo "STRIPE_PRODUCT_ROTATION_BOOST=$PROD_ID"
echo "STRIPE_PRICE_ROTATION_BOOST_7D=$PRICE_7D"
echo "STRIPE_PRICE_ROTATION_BOOST_30D=$PRICE_30D"
echo ""

if command -v netlify >/dev/null 2>&1 && [ -f scripts/tkfm-netlify-env-set.sh ]; then
  chmod +x scripts/tkfm-netlify-env-set.sh >/dev/null 2>&1 || true
  echo "== NETLIFY ENV SET =="
  ./scripts/tkfm-netlify-env-set.sh STRIPE_PRODUCT_ROTATION_BOOST "$PROD_ID" all || true
  ./scripts/tkfm-netlify-env-set.sh STRIPE_PRICE_ROTATION_BOOST_7D "$PRICE_7D" all || true
  ./scripts/tkfm-netlify-env-set.sh STRIPE_PRICE_ROTATION_BOOST_30D "$PRICE_30D" all || true
  echo "OK: Netlify env set attempted"
  echo "NEXT: restart netlify dev: netlify dev --port 8888"
fi

echo "DONE"
