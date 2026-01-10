#!/usr/bin/env bash
set -euo pipefail

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "FAIL: STRIPE_SECRET_KEY not set"
  exit 2
fi

RESP="$(curl -sS -u "${STRIPE_SECRET_KEY}:" https://api.stripe.com/v1/balance || true)"
MODE="$(echo "$RESP" | tr -d '\r\n' | sed -n 's/.*"livemode"[ ]*:[ ]*\(true\|false\).*/\1/p' | head -n 1)"
if [ -z "$MODE" ]; then
  echo "FAIL: could not determine Stripe mode"
  echo "$RESP" | head -c 200 || true
  echo
  exit 3
fi

echo "livemode=$MODE"
