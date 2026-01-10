#!/usr/bin/env bash
set -euo pipefail

# TKFM: diagnose why you're Unauthorized in one shot (no secrets)
#
# Usage:
#   netlify dev --port 8888
#   ./scripts/tkfm-owner-auth-diagnose.sh

BASE="${1:-http://localhost:8888}"

echo "== LOCAL KEY PRESENT? =="
KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs || true)"
if [ -n "${KEY}" ]; then
  echo "OK: local key loaded"
else
  echo "FAIL: missing local key -> run: ./scripts/tkfm-set-owner-key.sh --clipboard"
  exit 2
fi

echo
echo "== AUTH CHECK =="
./scripts/tkfm-owner-auth-check.sh "$BASE" || true

echo
echo "If Unauthorized: run:"
echo "  ./scripts/tkfm-fix-owner-key-mismatch.sh ."
echo "  (restart netlify dev)"
