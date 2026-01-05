#!/usr/bin/env bash
set -euo pipefail

# TKFM: BOOST E2E SMOKE TEST (safe default)
#
# Runs:
#  - Stripe bootstrap (create lookup_key prices if missing + set Netlify env)
#  - Starts netlify dev (port 8888) temporarily
#  - Verifies key pages + tracking endpoints
#
# Usage:
#   ./scripts/tkfm-boost-e2e-smoke.sh
#
# Optional (will attempt checkout session creation; may create real Stripe sessions):
#   ./scripts/tkfm-boost-e2e-smoke.sh --checkout

DO_CHECKOUT=0
if [ "${1:-}" = "--checkout" ]; then DO_CHECKOUT=1; fi

PORT="${TKFM_DEV_PORT:-8888}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "FAIL: missing $1"; exit 2; }; }

need curl
need node

chmod +x scripts/tkfm-wait-port.sh scripts/tkfm-detect-owner-key.sh 2>/dev/null || true

echo "== STEP 1: Stripe + Netlify env bootstrap (Boost prices) =="
if [ -x scripts/tkfm-boost-bootstrap.sh ]; then
  ./scripts/tkfm-boost-bootstrap.sh
else
  echo "FAIL: missing scripts/tkfm-boost-bootstrap.sh"
  exit 3
fi
echo

echo "== STEP 2: Quick wiring checks (files + ids) =="
if [ -x scripts/tkfm-boost-revenue-healthcheck.sh ]; then
  ./scripts/tkfm-boost-revenue-healthcheck.sh || true
else
  echo "WARN: missing scripts/tkfm-boost-revenue-healthcheck.sh"
fi
echo

echo "== STEP 3: Start netlify dev (temporary) =="
need netlify

# Start in background
netlify dev --port "$PORT" >/tmp/tkfm_netlify_dev.log 2>&1 &
PID=$!
echo "OK: netlify dev pid=$PID"
# Ensure we kill it on exit
cleanup() { kill "$PID" >/dev/null 2>&1 || true; }
trap cleanup EXIT

./scripts/tkfm-wait-port.sh "$PORT" 45
echo

BASE="http://localhost:${PORT}"

echo "== STEP 4: Featured tracking endpoint smoke (impression + click) =="
# Impression
curl -sS -X POST "${BASE}/.netlify/functions/featured-media-track" \
  -H "content-type: application/json" \
  --data '{"event":"impression","featuredId":"smoke-test","ts":'$(date +%s)'}' >/dev/null
echo "OK: impression posted"

# Click
curl -sS -X POST "${BASE}/.netlify/functions/featured-media-track" \
  -H "content-type: application/json" \
  --data '{"event":"click","featuredId":"smoke-test","ts":'$(date +%s)'}' >/dev/null
echo "OK: click posted"
echo

echo "== STEP 5: Owner endpoints (best-effort) =="
OWNER_KEY="$(./scripts/tkfm-detect-owner-key.sh)"
if [ -z "$OWNER_KEY" ]; then
  echo "WARN: no owner key found (.tkfm_owner_key or TKFM_OWNER_KEY). Skipping owner checks."
else
  # Stats admin endpoint (if present)
  if curl -sS "${BASE}/.netlify/functions/featured-media-stats-admin" \
      -H "x-tkfm-owner-key: ${OWNER_KEY}" >/tmp/tkfm_owner_stats.json 2>/dev/null; then
    if grep -q '"ok":false' /tmp/tkfm_owner_stats.json 2>/dev/null; then
      echo "WARN: owner stats unauthorized (owner key mismatch with Netlify env)"
      cat /tmp/tkfm_owner_stats.json || true
    else
      echo "OK: owner stats responded"
    fi
  else
    echo "WARN: owner stats endpoint not reachable"
  fi
fi
echo

echo "== STEP 6: Pages contain Boost lane ids =="
HIT=0
for f in radio-hub.html owner-paid-lane-inbox.html owner-boost-dashboard.html owner-boost-analytics.html; do
  if [ -f "$f" ]; then
    if grep -q "rotation_boost_7d" "$f"; then echo "OK: rotation_boost_7d in $f"; HIT=1; fi
    if grep -q "rotation_boost_30d" "$f"; then echo "OK: rotation_boost_30d in $f"; HIT=1; fi
  fi
done
if [ "$HIT" -eq 0 ]; then
  echo "WARN: did not find boost ids in those pages (may be elsewhere)"
fi
echo

if [ "$DO_CHECKOUT" -eq 1 ]; then
  echo "== OPTIONAL: Create checkout session (best-effort) =="
  echo "NOTE: This may create real Stripe sessions. Cancel at Stripe checkout page if needed."
  # Try a few likely request shapes (function implementations differ)
  for payload in \
    '{"planId":"rotation_boost_7d"}' \
    '{"lookup_key":"rotation_boost_7d"}' \
    '{"id":"rotation_boost_7d"}' \
    '{"plan":"rotation_boost_7d"}' \
    '{"priceLookupKey":"rotation_boost_7d"}'
  do
    echo "TRY payload: $payload"
    RES="$(curl -sS -X POST "${BASE}/.netlify/functions/create-checkout-session" \
      -H "content-type: application/json" \
      --data "$payload" || true)"
    echo "$RES" | head -c 500; echo
    if echo "$RES" | grep -Eiq 'https://checkout\.stripe\.com|url|session'; then
      echo "OK: got a response that looks like a session/url (see output above)"
      break
    fi
  done
  echo
fi

echo "DONE: smoke test complete"
echo "Log: /tmp/tkfm_netlify_dev.log"
