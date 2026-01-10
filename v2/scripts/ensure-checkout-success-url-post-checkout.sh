#!/usr/bin/env bash
set -euo pipefail

FILE="netlify/functions/create-checkout-session.js"
if [ ! -f "$FILE" ]; then
  echo "SKIP: $FILE not found"
  exit 0
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/checkout-success-url-$STAMP"
mkdir -p "$BK"
cp -p "$FILE" "$BK/"

echo "== TKFM: Ensure Stripe success_url routes to /post-checkout.html (auto submit) =="

# If success_url already contains post-checkout, do nothing.
if grep -q "post-checkout.html" "$FILE"; then
  echo "OK: post-checkout already referenced in success_url"
  exit 0
fi

# Best-effort replacement:
# Looks for "success_url:" line or a success_url assignment and replaces with a safe one.
# Does NOT change cancel_url.
# If pattern doesn't match, it leaves file intact.
perl -0777 -pe '
  s/success_url\s*:\s*([`'\""]).*?\1/success_url: `${origin}\/post-checkout.html?planId=${planId}&session_id={CHECKOUT_SESSION_ID}`/s
' -i "$FILE" 2>/dev/null || true

if grep -q "post-checkout.html" "$FILE"; then
  echo "PATCHED: success_url now uses /post-checkout.html?planId=..."
else
  echo "WARN: Could not auto-patch success_url (manual check needed). File backed up in $BK"
fi
