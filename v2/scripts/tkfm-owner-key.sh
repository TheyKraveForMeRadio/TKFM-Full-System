#!/usr/bin/env bash
set -euo pipefail

# TKFM: resolve owner key from env or local keyfile (NOT committed)
# Priority:
#   1) $TKFM_OWNER_KEY
#   2) ./.tkfm_owner_key
# Usage:
#   KEY="$(./scripts/tkfm-owner-key.sh)"
#   echo "$KEY"

if [ -n "${TKFM_OWNER_KEY:-}" ]; then
  echo "${TKFM_OWNER_KEY}"
  exit 0
fi

if [ -f ".tkfm_owner_key" ]; then
  KEY="$(cat .tkfm_owner_key | tr -d '\r\n' | xargs)"
  if [ -n "$KEY" ]; then
    echo "$KEY"
    exit 0
  fi
fi

echo ""
exit 0
