#!/usr/bin/env bash
set -euo pipefail

CTX="${1:-production}"
SCOPE="${2:-functions}"

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "FAIL: STRIPE_SECRET_KEY not set"
  exit 2
fi
if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

netlify env:set STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY" --context "$CTX" --scope "$SCOPE" >/dev/null
echo "OK: Netlify STRIPE_SECRET_KEY set ($CTX/$SCOPE)"
