#!/usr/bin/env bash
set -euo pipefail

# TKFM: Unset a Netlify env var safely across context/scope combos.
# Usage:
#   ./scripts/tkfm-netlify-env-unset-safe.sh KEY
# Removes from production + functions + default (best-effort).

KEY="${1:-}"
if [ -z "$KEY" ]; then
  echo "FAIL: missing KEY"
  exit 2
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

# Best-effort attempts (some CLI versions don't like ctx+scope together)
netlify env:unset "$KEY" --context production --scope functions >/dev/null 2>&1 || true
netlify env:unset "$KEY" --context production >/dev/null 2>&1 || true
netlify env:unset "$KEY" --scope functions >/dev/null 2>&1 || true
netlify env:unset "$KEY" >/dev/null 2>&1 || true

echo "OK: unset attempted for $KEY"
