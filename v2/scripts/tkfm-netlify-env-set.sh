#!/usr/bin/env bash
set -euo pipefail

# TKFM: Reliable netlify env:set (auto siteId)
#
# Usage:
#   ./scripts/tkfm-netlify-env-set.sh KEY VALUE [context]
#
# context defaults to "all"

KEY="${1:-}"
VAL="${2:-}"
CTX="${3:-all}"

if [ -z "$KEY" ] || [ -z "$VAL" ]; then
  echo "FAIL: usage: ./scripts/tkfm-netlify-env-set.sh KEY VALUE [context]"
  exit 2
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 3
fi

SITE_ID=""
if [ -f .netlify/state.json ]; then
  SITE_ID="$(node --input-type=module -e "import fs from 'node:fs'; try{const j=JSON.parse(fs.readFileSync('.netlify/state.json','utf8')); process.stdout.write(j.siteId||'');}catch(e){process.stdout.write('');}")"
fi

# Try with --site first if we have it (avoids account_id issues)
if [ -n "$SITE_ID" ]; then
  if netlify env:set "$KEY" "$VAL" --context "$CTX" --site "$SITE_ID" >/dev/null 2>&1; then
    echo "OK: $KEY set (context=$CTX site=$SITE_ID)"
    exit 0
  fi
fi

# Fallback: plain env:set (works when project is linked + CLI has account)
if netlify env:set "$KEY" "$VAL" --context "$CTX" >/dev/null 2>&1; then
  echo "OK: $KEY set (context=$CTX)"
  exit 0
fi

echo "FAIL: netlify env:set failed (project may not be linked). Run: netlify link"
exit 4
