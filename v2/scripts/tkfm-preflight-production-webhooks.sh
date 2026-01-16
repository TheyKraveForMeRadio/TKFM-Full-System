#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "TKFM PROD WEBHOOK PREFLIGHT"
echo

# 1) Ensure _redirects has functions passthrough as FIRST line
if [ ! -f "_redirects" ]; then
  echo "ERROR: _redirects missing. Create it with:"
  echo '  /.netlify/functions/*  /.netlify/functions/:splat  200!'
  exit 2
fi

FIRST="$(head -n 1 _redirects | tr -d '\r')"
REQ='/.netlify/functions/*  /.netlify/functions/:splat  200!'
if [ "$FIRST" != "$REQ" ]; then
  echo "ERROR: _redirects first line is not the required functions passthrough."
  echo "FOUND: $FIRST"
  echo "NEED : $REQ"
  echo
  echo "Fix:"
  echo "  printf '$REQ\n' > _redirects.__tmp__ && grep -v '^/\\.netlify/functions/\\*' _redirects >> _redirects.__tmp__ && mv _redirects.__tmp__ _redirects"
  exit 3
fi
echo "OK: _redirects functions passthrough is first line"

# 2) Ensure netlify.toml does NOT contain /.netlify/functions redirects (Netlify dev rejects it; prod can cause confusion)
if [ -f "netlify.toml" ] && grep -q '\.netlify/functions' netlify.toml; then
  echo "WARN: netlify.toml contains '.netlify/functions' redirects. Remove them (use _redirects instead)."
fi

# 3) Ensure local-only env flags are NOT in .env
if [ -f ".env" ]; then
  if grep -q '^TKFM_WEBHOOK_INSECURE_LOCAL=' .env; then
    echo "ERROR: .env contains TKFM_WEBHOOK_INSECURE_LOCAL. DO NOT SHIP THIS."
    grep -n '^TKFM_WEBHOOK_INSECURE_LOCAL=' .env || true
    exit 4
  fi
  if grep -q '^TKFM_WEBHOOK_LOCAL_DEFAULT_' .env; then
    echo "ERROR: .env contains TKFM_WEBHOOK_LOCAL_DEFAULT_* vars. DO NOT SHIP THESE."
    grep -n '^TKFM_WEBHOOK_LOCAL_DEFAULT_' .env || true
    exit 5
  fi
  if grep -q '^TKFM_WEBHOOK_LOCAL_DEFAULT_CUSTOMER_ID=' .env; then
    echo "ERROR: .env contains TKFM_WEBHOOK_LOCAL_DEFAULT_CUSTOMER_ID. DO NOT SHIP THIS."
    grep -n '^TKFM_WEBHOOK_LOCAL_DEFAULT_CUSTOMER_ID=' .env || true
    exit 6
  fi
fi
echo "OK: .env has no local-only webhook flags"

# 4) Quick check: webhook functions exist
for f in netlify/functions/stripe-webhook-sponsor.js netlify/functions/stripe-webhook-drops.js; do
  if [ ! -f "$f" ]; then
    echo "ERROR: missing $f"
    exit 7
  fi
done
echo "OK: webhook functions present"

echo
echo "PASS ✅"
