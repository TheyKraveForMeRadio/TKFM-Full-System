#!/usr/bin/env bash
set -euo pipefail

# TKFM: Boost Go-Live Verify (ENV-FIRST)
# Fix: Don't hard-fail on Stripe lookup_key support. Netlify env price ids are enough.
#
# What it checks:
# - Boost nav links exist on core pages (best-effort)
# - Boost price env vars exist (Netlify env OR local .env)
# - If STRIPE_SECRET_KEY is set, verify price ids exist and match LIVE/TEST mode
#
# Usage:
#   ./scripts/tkfm-boost-go-live-verify.sh
#   STRIPE_SECRET_KEY=sk_live_... ./scripts/tkfm-boost-go-live-verify.sh

ok(){ echo "OK: $1"; }
warn(){ echo "WARN: $1"; }
fail(){ echo "FAIL: $1"; exit 2; }

have(){ command -v "$1" >/dev/null 2>&1; }

get_env_local () {
  local k="$1"
  if [ -f .env ]; then
    grep -E "^${k}=" .env | tail -n 1 | cut -d= -f2- | tr -d '\r\n' || true
  fi
}

get_env_netlify () {
  local k="$1"
  if have netlify; then
    netlify env:get "$k" 2>/dev/null | tr -d '\r\n' || true
  fi
}

resolve_price_env () {
  local k="$1"
  local v
  v="$(get_env_netlify "$k")"
  if [ -z "$v" ]; then
    v="$(get_env_local "$k")"
  fi
  printf "%s" "$v"
}

echo "== TKFM BOOST: GO LIVE VERIFY =="

# 1) Core pages include boost nav link (best effort)
for f in index.html pricing.html radio-hub.html feature-engine.html social-engine.html dj-mixtape-hosting.html label-home.html label-hub.html; do
  if [ -f "$f" ]; then
    if grep -q "rotation-boost.html" "$f"; then ok "$f has boost link"; else warn "$f missing boost link"; fi
  else
    warn "missing file $f (skipping)"
  fi
done

# 2) Price env vars exist
P7="$(resolve_price_env STRIPE_PRICE_ROTATION_BOOST_7D)"
P30="$(resolve_price_env STRIPE_PRICE_ROTATION_BOOST_30D)"

if [ -z "$P7" ] || [ -z "$P30" ]; then
  warn "Missing one or both env vars:"
  warn "  STRIPE_PRICE_ROTATION_BOOST_7D=$P7"
  warn "  STRIPE_PRICE_ROTATION_BOOST_30D=$P30"
  warn "If you already created prices, set them in Netlify:"
  warn "  netlify env:set STRIPE_PRICE_ROTATION_BOOST_7D price_..."
  warn "  netlify env:set STRIPE_PRICE_ROTATION_BOOST_30D price_..."
  fail "Boost price env vars not set"
fi

ok "Boost price env vars present"
echo "STRIPE_PRICE_ROTATION_BOOST_7D=$P7"
echo "STRIPE_PRICE_ROTATION_BOOST_30D=$P30"

# 3) Optional: verify mode matches key
if [ -n "${STRIPE_SECRET_KEY:-}" ]; then
  if [ -f scripts/tkfm-stripe-verify-price-mode.sh ]; then
    chmod +x scripts/tkfm-stripe-verify-price-mode.sh >/dev/null 2>&1 || true
    echo "== CHECK: Stripe price ids match key mode (best-effort) =="
    ./scripts/tkfm-stripe-verify-price-mode.sh "$P7" "$P30"
  else
    warn "scripts/tkfm-stripe-verify-price-mode.sh missing; skipping mode check"
  fi
else
  warn "STRIPE_SECRET_KEY not set; skipping Stripe API mode check"
fi

echo "OK: verify finished"
