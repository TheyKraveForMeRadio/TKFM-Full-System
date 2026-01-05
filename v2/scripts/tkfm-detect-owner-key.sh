#!/usr/bin/env bash
set -euo pipefail
# Prints owner key if found (no newline), else empty.
# Sources: ./.tkfm_owner_key then env TKFM_OWNER_KEY

if [ -f ".tkfm_owner_key" ]; then
  KEY="$(cat .tkfm_owner_key 2>/dev/null | tr -d '\r\n' | xargs || true)"
  if [ -n "$KEY" ]; then printf "%s" "$KEY"; exit 0; fi
fi

if [ -n "${TKFM_OWNER_KEY:-}" ]; then
  printf "%s" "$TKFM_OWNER_KEY"
  exit 0
fi

printf "%s" ""
