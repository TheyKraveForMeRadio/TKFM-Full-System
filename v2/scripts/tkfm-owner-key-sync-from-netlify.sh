#!/usr/bin/env bash
set -euo pipefail

# TKFM: Sync local owner key from Netlify env (so owner endpoints stop 401'ing)
# Requires: netlify CLI logged in + linked site
#
# Usage:
#   ./scripts/tkfm-owner-key-sync-from-netlify.sh .
#
ROOT="${1:-.}"
cd "$ROOT"

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found. Install: npm i -g netlify-cli"
  exit 2
fi

KEY="$(netlify env:get TKFM_OWNER_KEY 2>/dev/null || true)"
KEY="$(printf "%s" "$KEY" | tr -d '\r\n')"

if [ -z "$KEY" ]; then
  echo "FAIL: Netlify env TKFM_OWNER_KEY not found. (Are you linked to the right site?)"
  echo "Try: netlify status"
  exit 3
fi

# Write local keyfile (local only)
printf "%s\n" "$KEY" > ./.tkfm_owner_key
echo "OK: wrote ./.tkfm_owner_key (local only)"

# Ensure .env exists
touch .env

# Upsert TKFM_OWNER_KEY in .env
if grep -q '^TKFM_OWNER_KEY=' .env; then
  # Replace line
  # shellcheck disable=SC2016
  perl -0777 -pe 's/^TKFM_OWNER_KEY=.*$/TKFM_OWNER_KEY='"$KEY"'/m' -i .env
else
  printf "\nTKFM_OWNER_KEY=%s\n" "$KEY" >> .env
fi

echo "OK: synced .env (TKFM_OWNER_KEY)"
echo "NEXT: restart dev: netlify dev --port 8888"
