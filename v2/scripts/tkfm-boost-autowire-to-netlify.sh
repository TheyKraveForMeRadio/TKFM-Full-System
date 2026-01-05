#!/usr/bin/env bash
set -euo pipefail

# TKFM: Boost Auto-Wire to Netlify (robust + ESM-safe)
# FIX: use reliable env:set helper to avoid account_id errors.

need() { echo "FAIL: $1"; exit 2; }
mk(){ mktemp 2>/dev/null || echo "/tmp/tkfm_$RANDOM.json"; }

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  need "STRIPE_SECRET_KEY not set. Example: export STRIPE_SECRET_KEY=sk_live_..."
fi
if ! command -v netlify >/dev/null 2>&1; then
  need "netlify CLI not found. Install: npm i -g netlify-cli"
fi
if [ ! -f scripts/tkfm-netlify-env-set.sh ]; then
  need "scripts/tkfm-netlify-env-set.sh missing (unzip latest patch)"
fi

get_from_envfile () {
  local key="$1"
  [ -f .env ] || return 0
  grep -E "^${key}=" .env | tail -n 1 | cut -d= -f2- | tr -d '\r\n' || true
}

get_from_netlify () {
  local key="$1"
  netlify env:get "$key" 2>/dev/null | tr -d '\r\n' || true
}

stripe_find_by_lookup_to_file () {
  local lookup="$1"
  local out="$2"
  curl -sS "https://api.stripe.com/v1/prices?lookup_keys[]=${lookup}&limit=1" -u "${STRIPE_SECRET_KEY}:" > "$out"
}

json_get_first_id_from_file () {
  local fp="$1"
  node --input-type=module - "$fp" <<'NODE'
import fs from 'node:fs';
const fp = process.argv.slice(2)[0] || '';
try{
  const j = JSON.parse(fs.readFileSync(fp,'utf8'));
  if (j?.error?.message) process.stdout.write('');
  else process.stdout.write(String(j?.data?.[0]?.id || ''));
}catch(e){
  process.stdout.write('');
}
NODE
}

resolve_lookup () {
  local lookup="$1"
  local tmp
  tmp="$(mk)"
  stripe_find_by_lookup_to_file "$lookup" "$tmp"
  local id
  id="$(json_get_first_id_from_file "$tmp")"
  rm -f "$tmp" 2>/dev/null || true
  printf "%s" "$id"
}

PRICE_7D="$(resolve_lookup rotation_boost_7d)"
PRICE_30D="$(resolve_lookup rotation_boost_30d)"

if [ -z "$PRICE_7D" ] || [ -z "$PRICE_30D" ]; then
  echo "WARN: could not resolve via lookup_keys[] search. Falling back to env price ids."

  P7="$(get_from_envfile STRIPE_PRICE_ROTATION_BOOST_7D)"
  P30="$(get_from_envfile STRIPE_PRICE_ROTATION_BOOST_30D)"
  if [ -z "$P7" ]; then P7="$(get_from_netlify STRIPE_PRICE_ROTATION_BOOST_7D)"; fi
  if [ -z "$P30" ]; then P30="$(get_from_netlify STRIPE_PRICE_ROTATION_BOOST_30D)"; fi

  if [ -z "$P7" ] || [ -z "$P30" ]; then
    echo "FAIL: missing Boost price ids in .env or Netlify env."
    exit 3
  fi

  PRICE_7D="$P7"
  PRICE_30D="$P30"
fi

chmod +x scripts/tkfm-netlify-env-set.sh >/dev/null 2>&1 || true
./scripts/tkfm-netlify-env-set.sh STRIPE_PRICE_ROTATION_BOOST_7D "$PRICE_7D" all
./scripts/tkfm-netlify-env-set.sh STRIPE_PRICE_ROTATION_BOOST_30D "$PRICE_30D" all

echo "STRIPE_PRICE_ROTATION_BOOST_7D=$PRICE_7D"
echo "STRIPE_PRICE_ROTATION_BOOST_30D=$PRICE_30D"
echo "OK: Netlify env set"
echo "NEXT: restart netlify dev: netlify dev --port 8888"
