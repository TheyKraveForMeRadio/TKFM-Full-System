#!/usr/bin/env bash
set -euo pipefail

# TKFM: verify your local key matches server env (local netlify dev or prod)
#
# Usage:
#   ./scripts/tkfm-set-owner-key.sh --clipboard
#   ./scripts/tkfm-sync-owner-key-to-dotenv.sh
#   netlify dev --port 8888
#   ./scripts/tkfm-owner-auth-check.sh http://localhost:8888
#
#   ./scripts/tkfm-owner-auth-check.sh https://www.tkfmradio.com

BASE="${1:-http://localhost:8888}"

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs || true)"
if [ -z "${KEY}" ]; then
  echo "FAIL: missing owner key (set with ./scripts/tkfm-set-owner-key.sh --clipboard)"
  exit 2
fi

curl -sS "${BASE}/.netlify/functions/owner-auth-check" \
  -H "x-tkfm-owner-key: ${KEY}" | cat
echo
