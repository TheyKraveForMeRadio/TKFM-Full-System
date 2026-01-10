#!/usr/bin/env bash
set -euo pipefail

# TKFM: Snapshot Boost-related env values to a local file (no secrets)
# Captures from Netlify env first, then falls back to local .env.
#
# Usage:
#   ./scripts/tkfm-boost-env-snapshot.sh test
#   ./scripts/tkfm-boost-env-snapshot.sh live

NAME="${1:-}"
if [ -z "$NAME" ]; then
  echo "FAIL: provide snapshot name (example: test or live)"
  exit 2
fi

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

resolve () {
  local k="$1"
  local v
  v="$(get_env_netlify "$k")"
  if [ -z "$v" ]; then v="$(get_env_local "$k")"; fi
  printf "%s" "$v"
}

OUT=".tkfm_boost_env_${NAME}.txt"
TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "")"

P7="$(resolve STRIPE_PRICE_ROTATION_BOOST_7D)"
P30="$(resolve STRIPE_PRICE_ROTATION_BOOST_30D)"
PROD="$(resolve STRIPE_PRODUCT_ROTATION_BOOST)"

cat > "$OUT" <<EOF
# TKFM BOOST ENV SNAPSHOT: ${NAME}
# created_utc=${TS}
STRIPE_PRODUCT_ROTATION_BOOST=${PROD}
STRIPE_PRICE_ROTATION_BOOST_7D=${P7}
STRIPE_PRICE_ROTATION_BOOST_30D=${P30}
EOF

echo "OK: wrote $OUT"
cat "$OUT"
