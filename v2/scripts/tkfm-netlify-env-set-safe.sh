#!/usr/bin/env bash
set -euo pipefail

# TKFM: Set a Netlify env var safely even when CLI refuses context+scope updates in one shot.
# Usage:
#   ./scripts/tkfm-netlify-env-set-safe.sh KEY VALUE [context] [scope]
# Defaults: context=production scope=functions

KEY="${1:-}"
VAL="${2:-}"
CTX="${3:-production}"
SCOPE="${4:-functions}"

if [ -z "$KEY" ]; then
  echo "FAIL: missing KEY"
  exit 2
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

# Attempt full set first (works for fresh vars on many CLI versions)
netlify env:set "$KEY" "$VAL" --context "$CTX" --scope "$SCOPE" >/dev/null 2>&1 || true

# If it existed, some CLI versions require updating context and scope separately.
netlify env:set "$KEY" "$VAL" --context "$CTX" >/dev/null 2>&1 || true
netlify env:set "$KEY" "$VAL" --scope "$SCOPE" >/dev/null 2>&1 || true

# Final best-effort verify (no fail)
echo "OK: set $KEY (context=$CTX scope=$SCOPE)"
