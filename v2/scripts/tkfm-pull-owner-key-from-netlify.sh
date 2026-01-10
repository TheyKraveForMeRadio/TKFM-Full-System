#!/usr/bin/env bash
set -euo pipefail

# TKFM: make Netlify env TKFM_OWNER_KEY the source of truth locally.
# Writes:
#   - ./.tkfm_owner_key (gitignored)
#   - updates .env (TKFM_OWNER_KEY=...) so netlify dev authorizes
#
# Usage:
#   ./scripts/tkfm-pull-owner-key-from-netlify.sh
#
# Requires:
#   netlify login
#   netlify link (site linked)

ROOT="${1:-.}"
cd "$ROOT"

KEY="$(node scripts/tkfm-netlify-get-env.cjs TKFM_OWNER_KEY 2>/dev/null || true)"
KEY="$(printf "%s" "$KEY" | tr -d '\r\n' | xargs || true)"

if [ -z "$KEY" ]; then
  echo "FAIL: could not pull TKFM_OWNER_KEY from Netlify CLI."
  echo "Run: netlify status  (ensure linked)  and  netlify env:list"
  exit 2
fi

printf "%s" "$KEY" > .tkfm_owner_key
echo "OK: saved ./.tkfm_owner_key from Netlify env"

if [ -x scripts/tkfm-sync-owner-key-to-dotenv.sh ]; then
  ./scripts/tkfm-sync-owner-key-to-dotenv.sh .
else
  touch .env
  if grep -qE '^TKFM_OWNER_KEY=' .env; then
    perl -0777 -pe "s/^TKFM_OWNER_KEY=.*$/TKFM_OWNER_KEY=${KEY}/m" -i .env
  else
    echo "" >> .env
    echo "TKFM_OWNER_KEY=${KEY}" >> .env
  fi
  echo "OK: .env synced (TKFM_OWNER_KEY)"
fi

echo "NEXT: restart netlify dev"
