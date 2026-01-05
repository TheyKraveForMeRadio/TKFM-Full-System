#!/usr/bin/env bash
set -euo pipefail

# TKFM: Ensure Boost prices exist WITH lookup_key set at create-time
# FIX: lookup_key may already exist on a DIFFERENT product — reuse it.
#
# Behavior:
# 1) Prefer global lookup search:
#    GET /v1/prices?lookup_keys[]=rotation_boost_7d
# 2) If not found, create a new price with lookup_key.
# 3) If create fails "already uses that lookup key", re-resolve via lookup and continue.
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

# ---------- ESM-safe JSON helpers (node - stdin argv shifts) ----------
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
const args = process.argv.slice(2);
const fp = args[0] || '';
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
const args = process.argv.slice(2);
const fp = args[0] || '';
try{
  const j = JSON.parse(fs.readFileSync(fp,'utf8'));
  const id = j?.data?.[0]?.id || '';
  process.stdout.write(String(id||''));
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

# ---------- Stripe helpers ----------
stripe_price_by_lookup () {
  local lookup="$1"
  local out="$2"
  curl_get_to_file "https://api.stripe.com/v1/prices?lookup_keys[]=${lookup}&limit=1" "$out"
}

resolve_lookup_price_id () {
  local lookup="$1"
  local tmp
  tmp="$(mk)"
  stripe_price_by_lookup "$lookup" "$tmp"
  local id
  id="$(node_get_first_price_id "$tmp")"
  rm -f "$tmp" 2>/dev/null || true
  printf "%s" "$id"
}

echo "== TKFM STRIPE: ENSURE BOOST PRICES WITH LOOKUP =="

# 1) Find or create product (product is mainly for metadata + organization)
TMPP="$(mk)"
curl_get_to_file "https://api.stripe.com/v1/products?limit=100" "$TMPP"
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
  rm -f "$TMPC" 2>/dev/null || true
fi

echo "OK: product=$PROD_ID"

# 2) Prefer global lookup-key resolution (works even if price belongs to other product)
PRICE_7D="$(resolve_lookup_price_id rotation_boost_7d)"
PRICE_30D="$(resolve_lookup_price_id rotation_boost_30d)"

if [ -n "$PRICE_7D" ]; then
  echo "OK: found existing lookup rotation_boost_7d -> $PRICE_7D"
fi
if [ -n "$PRICE_30D" ]; then
  echo "OK: found existing lookup rotation_boost_30d -> $PRICE_30D"
fi

# 3) Create missing prices (lookup_key at create-time)
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
  if [ -z "$NEW7" ]; then
    MSG="$(node_get_error_message "$TMP7")"
    if echo "$MSG" | grep -qi "already uses that lookup key"; then
      # race/exists on other product: resolve and continue
      RESOLVED="$(resolve_lookup_price_id rotation_boost_7d)"
      if [ -n "$RESOLVED" ]; then
        echo "OK: lookup already existed, using $RESOLVED"
        PRICE_7D="$RESOLVED"
        rm -f "$TMP7" 2>/dev/null || true
      else
        echo "FAIL: lookup exists but could not resolve via search"
        cat "$TMP7" || true
        rm -f "$TMP7" 2>/dev/null || true
        exit 5
      fi
    else
      echo "FAIL: price create (7d) failed"
      cat "$TMP7" || true
      rm -f "$TMP7" 2>/dev/null || true
      exit 5
    fi
  else
    PRICE_7D="$NEW7"
    rm -f "$TMP7" 2>/dev/null || true
  fi
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
  if [ -z "$NEW30" ]; then
    MSG="$(node_get_error_message "$TMP30")"
    if echo "$MSG" | grep -qi "already uses that lookup key"; then
      RESOLVED="$(resolve_lookup_price_id rotation_boost_30d)"
      if [ -n "$RESOLVED" ]; then
        echo "OK: lookup already existed, using $RESOLVED"
        PRICE_30D="$RESOLVED"
        rm -f "$TMP30" 2>/dev/null || true
      else
        echo "FAIL: lookup exists but could not resolve via search"
        cat "$TMP30" || true
        rm -f "$TMP30" 2>/dev/null || true
        exit 6
      fi
    else
      echo "FAIL: price create (30d) failed"
      cat "$TMP30" || true
      rm -f "$TMP30" 2>/dev/null || true
      exit 6
    fi
  else
    PRICE_30D="$NEW30"
    rm -f "$TMP30" 2>/dev/null || true
  fi
fi

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
